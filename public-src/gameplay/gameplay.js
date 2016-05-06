/**
 * Created by sail on 2016/5/5.
 */
'use strict';
import 'lodash'

function explore() {

}

function battle(chars, enemies) {
	var end = false, limit = 1000, turn = 0, reports = [];
	var timeQueue = new TimeQueue(chars, enemies, reports);
	while (!end && (limit > ++turn)) {
		end = timeQueue.run();
	}
	timeQueue.end();
	return {reports}
}

class TimeQueue {
	constructor(chars, enemies, reports) {
		var _this = this;
		this.charCount = chars.length;
		this.enemyCount = enemies.length;
		this.charSurvive = chars.length;
		this.enemySurvive = enemies.length;
		this.count = chars.length + enemies.length;
		this.creatures = chars.concat(enemies);
		this.creatureMap = this.creatures.reduce(function (r, x, i) {
			x.id = i;
			r[i] = x;
			return r;
		}, {});
		this.chars = chars;
		this.enemies = enemies;
		this.times = chars.map(x=>1000).concat(enemies.map(x=>1000));
		this.speeds = chars.map(x=>x.speed).concat(enemies.map(x=>x.speed));

		this.deathList = new Array(this.count).map(x=>false);
		this.index = this.count - 1;
		this.reports = reports;

		this.creatures.forEach(function (c) {
			c.timeQueue = _this;
		});

		// 生成战斗开始的记录
		this.genReport(new Action(null, 'start', {
			enemyCount: this.enemyCount, statusChange: this.calcChange(this.creatures)
		}));
	}

	end() {
		this.creatures.forEach(function (c) {
			delete c.timeQueue;
		})
	}

	run() {
		var _this = this;
		while (1) {
			// 其中一方全部死亡时游戏结束，返回false
			if (this.charSurvive === 0 || this.enemySurvive === 0) {
				if (this.charSurvive) {
					this.genReport(new Action(null, 'success', {
						statusChange: this.calcChange(this.chars)
					}));
				} else {
					this.genReport(new Action(null, 'fail', {
						statusChange: this.calcChange(this.chars)
					}));
				}
				// TODO 战斗结束处理
				return true
			}
			// 跳过死亡生物
			// TODO 昏睡等状况也可能会由此步骤处理
			if (this.creatures[this.index].isDead) {
				this.index++;
				this.index %= this.count;
				continue;
			}
			if (this.times[this.index] < 0) {

				var [action,effects] = this.creatures[this.index].action(this.chars, this.enemies);
				if (effects) {
					var changed = {};
					effects.forEach(function (effect) {
						switch (effect[1]) {
							case 'hp':
								effect[0].changeHp(effect[2]);
								changed[effect[0].id] = true;
						}
					});
					action.statusChange = this.calcChange(_.keys(changed));
				}
				this.times[this.index] += action.time;
				this.genReport(action);
				this.deathCheck();
				break;
			} else {
				this.index++;
				this.index %= this.count;
				this.times[this.index] -= this.speeds[this.index];
			}
		}
	}

	deathCheck() {
		var _this = this;
		this.creatures.forEach(function (creature, index) {
			if (creature.isDead !== _this.deathList[index]) {
				if (creature.isDead) {
					_this.deathList[index] = true;
					creature.isEnemy ? _this.enemySurvive-- : _this.charSurvive--;
					_this.genReport(new Action(creature, 'die'));
				}
			}
		});
	}

	calcChange(targets) {
		var _this = this, result = {}, flag = false;
		targets.forEach(function (index) {
			var target;
			if (index instanceof Creature) {
				target = index;
				index = target.id;
			} else {
				target = _this.creatureMap[index];
			}
			flag = true;
			if (index < _this.charCount) {
				result.chars = result.chars || {};
				result.chars[index] = _.pick(target, 'hp', 'mp');
			} else {
				result.enemies = result.enemies || {};
				result.enemies[index - _this.charCount] = _.pick(target, 'hp', 'mp');
			}
		});
		return flag ? result : void(0);
	}

	genReport(action) {
		this.reports.push(battleReports[action.type](action));
	}
}

class Creature {
	constructor(options) {
		this.name = options.name;
		this.isEnemy = options.isEnemy;
		this.speed = options.speed;
		this.isDead = options.idDead || false;
		this.maxHp = options.maxHp;
		this.hp = options.hp || options.maxHp;
		this.commonStrategies = options.commonStrategies || {buff: 2, heal: 2, attack: 2}
	}

	action(chars, enemies) {
		var _allies = this.isEnemy ? enemies : chars;
		var _enemies = this.isEnemy ? chars : enemies;
		return this.attack(_enemies);
	}

	attack(enemies) {
		var target = enemies.find(x=>!x.isDead);
		var damage = 12;
		//target.setHp(target.hp - damage);
		return [new Action(this, 'attack', {
			time: 1000, target: target.name, damage//, statusChange: this.timeQueue.calcChange([target])
		}), [[target, 'hp', -damage]]];
	}


	changeHp(hp) {
		console.log(this.isDead);
		if (this.isDead) {
			return;
		}
		this.hp += hp;
		if (this.hp < 0) {
			this.hp = 0;
		} else if (this.hp > this.maxHp) {
			this.hp = maxHp;
		}
		if (this.hp === 0) {
			this.isDead = true;
		}
	}
}

class Action {
	constructor(creature, type, options) {
		options = options || {};
		this.creature = creature;
		this.type = type;
		this.time = options.time || 0;
		this.option = options;
		this.statusChange = options.statusChange;
	}
}

var battleReports = {
	attack: function (action) {
		return {
			title: `${action.creature.name}发动攻击`,
			content: `对${action.option.target}造成${action.option.damage}点伤害`,
			statusChange: action.statusChange,
			type: action.type
		}
	}, die: function (action) {
		return {
			title: `${action.creature.name}已被击倒`, type: action.type
		}
	}, start: function (action) {
		return {
			title: '战斗开始', content: `遇到${action.option.enemyCount}个敌人`, statusChange: action.statusChange, type: action.type
		}
	}, success: function (action) {
		return {
			title: '战斗胜利', statusChange: action.statusChange, type: action.type
		}
	}, fail: function (action) {
		return {
			title: '战斗失败'
		}
	}
};

var chars = [new Creature({name: '角色1', isEnemy: false, speed: 1000, maxHp: 100}),
	new Creature({name: '角色2', isEnemy: false, speed: 1000, maxHp: 100}),
	new Creature({name: '角色3', isEnemy: false, speed: 1000, maxHp: 100})];
var enemies = [new Creature({name: '史莱姆A', isEnemy: true, speed: 1000, maxHp: 20}),
	new Creature({name: '史莱姆B', isEnemy: true, speed: 1000, maxHp: 20}),
	new Creature({name: '史莱姆C', isEnemy: true, speed: 1000, maxHp: 20})];
var result = battle(chars, enemies).reports;
export {result}
