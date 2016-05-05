/**
 * Created by sail on 2016/5/3.
 */
import 'jquery'
import angular from 'angular'
import 'bootstrap'
import 'angular-ui-bootstrap'
import '../node_modules/bootstrap/dist/css/bootstrap.css'
import './index.css'
import './monster.css'
import './event.css'
import 'lodash'

angular.element(document).ready(function () {
	var app = angular.module('app', ['ui.bootstrap']);
	app.controller('mainCtrl', ['$scope', '$uibModal', 'parseType', function ($scope, $uibModal, parseType) {
		var status = {
			characters: [{
				name: '塔尼斯', hp: 43, maxHp: 43, mp: 31, maxMp: 31, exp: 5784, lv: 9
			}, {
				name: '拉伊', hp: 43, maxHp: 49, mp: 49, maxMp: 31, exp: 5567, lv: 9
			}, {
				name: '法伊斯托斯', hp: 39, maxHp: 39, mp: 53, maxMp: 53, exp: 5739, lv: 9
			}]
		};
		$scope.clickLog = function (log) {
			$scope.eventModal = $uibModal.open({
				//animation: $scope.animationsEnabled,
				templateUrl: 'eventLog', controller: 'eventCtrl', //size: size,
				resolve: {
					event: function () {
						return log;
					}, types: function () {
						return $scope.types;
					}
				}
			});
		};
		$scope.taskInfo = {locationName: '测试村庄', taskName: '测试任务'};
		$scope.taskLogs = [{
			time: '13:20',
			info: '任务开始',
			type: 'start',
			content: '目标：湖畔洞窟6层'
		},
			{
				time: '13:20',
				info: '进入地牢',
				type: 'enter-dungeon'
			},
			{
				time: '13:20',
				info: '开始探索1层',
				type: 'enter-block-normal',
				remark: '[湖畔洞窟1层 第1地区]'
			},
			{
				time: '13:21',
				info: '发现泉水',
				type: 'spring'
			},
			{
				time: '13:22',
				info: '发现泉水',
				type: 'spring'
			},
			{
				time: '13:23',
				info: '向下一个地区前进',
				type: 'enter-block-normal',
				remark: '[湖畔洞窟1层 第2地区]'
			},
			{
				time: '13:26',
				info: '向下一个地区前进',
				type: 'enter-block-normal',
				remark: '[湖畔洞窟1层 第3地区]'
			},
			{
				time: '13:26',
				info: '发现泉水',
				type: 'spring'
			},
			{
				time: '13:29',
				info: '开始探索2层',
				type: 'enter-floor',
				remark: '[湖畔洞窟2层 第1地区]'
			},
			{
				time: '13:30',
				info: '队伍遇到了2只史莱姆',
				type: 'encounter-win',
				target: 'monster-002',
				battleInfo: {enemies: [{name: '史莱姆A', hp: 11, maxHp: 11}, {name: '史莱姆B', hp: 11, maxHp: 11}]},
				battleLog: [{
					titleTmp: '遭遇2只史莱姆',
					contentTmp: '遇到1个敌人(等级1)',
					char: [0, 1, 2],
					type: 'encounter'
				},
					{
						titleTmp: '{{c0}}发动攻击',
						contentTmp: '对{{e0}}造成了11点伤害',
						enemy: [0],
						type: 'encounter',
						statusChange: {enemies: {0: {hp: 0}}}
					},
					{
						titleTmp: '{{e0}}倒下了',
						type: 'encounter'
					},
					{
						titleTmp: '{{c1}}吟唱了魔法',
						contentTmp: '{{e1}}造成了11点伤害',
						enemy: [1],
						type: 'encounter'
					},
					{
						titleTmp: '{{e1}}倒下了',
						type: 'encounter'
					}]
			},
			{
				time: '11:41',
				info: '任务结束',
				type: 'returned'
			}];
		$scope.taskLogs.forEach(function (item) {
			parseType.event(item);
			if (!item.statusChange) {
				item.status = status;
			} else {
				item.status = {
					characters: item.statusChange.characters || status.characters,
					backpack: item.statusChange.backpack || status.backpack
				};
			}
		});
		$scope.types = {
			'start': {category: 'default'},
			'returned': {category: 'safe'},
			'enter-dungeon': {category: 'default'},
			'enter-block-normal': {category: 'default'},
			'spring': {category: 'important'},
			'encounter-win': {category: 'default'},
			'enter-floor': {category: 'default'}
		}
	}]);
	app.controller('eventCtrl', ['$scope',
		'$uibModalInstance',
		'event',
		'types',
		'parseType',
		function ($scope, $uibModalInstance, event, types, parseType) {
			$scope.event = event;
			$scope.types = types;
			$scope.eventClose = function () {
				$uibModalInstance.dismiss('cancel');
			};
			$scope.parseChar = function (char) {
				var info = char.name;
				if (char.hp !== void(0)) {
					info += ' HP:' + char.hp + '/' + char.maxHp;
				}
				if (char.mp !== void(0)) {
					info += ' MP:' + char.mp + '/' + char.maxMp;
				}
				if (char.exp !== void(0)) {
					info += ' 经验:' + char.exp;
				}
				if (char.lv !== void(0)) {
					info += ' 等级:' + char.lv;
				}
				return info;
			};
			$scope.parseTemplate = function (string, vars) {
				var trunk = string.split('{{');
				var result = trunk[0];
				trunk.splice(0, 1);
				trunk.forEach(function (sub) {
					var pair = sub.split('}}');
					result += vars[pair[0]] + pair[1];
				});
				return result;
			};
			if (event.battleLog) {
				var vars = {};

				var status = {characters: event.status.characters, enemies: event.battleInfo.enemies};
				event.status.characters.forEach(function (char, index) {
					vars['c' + index] = char.name;
				});
				event.battleInfo.enemies.forEach(function (enemy, index) {
					vars['e' + index] = enemy.name;
				});
				event.battleLog.forEach(function (action) {

					//填充模板
					if (action.titleTmp) {
						action.title = $scope.parseTemplate(action.titleTmp, vars);
					}
					if (action.contentTmp) {
						action.content = $scope.parseTemplate(action.contentTmp, vars);
					}

					//计算当前状态
					if (action.statusChange) {
						action.status = _.cloneDeep(status);
						_.forEach(action.statusChange.char, function (v, k) {
							action.status.characters[k] = _.defaults({}, v, action.status.characters[k]);
						});
						_.forEach(action.statusChange.enemies, function (v, k) {
							action.status.enemies[k] = _.defaults({}, v, action.status.enemies[k]);
						});
					} else {
						action.status = status;
					}
					parseType.action(action);
				});
			}
		}]);

	app.factory('parseType', function () {

		var eventTypes = {
			'start': {category: 'default'},
			'returned': {category: 'safe'},
			'enter-dungeon': {category: 'default'},
			'enter-block-normal': {category: 'default'},
			'spring': {category: 'important'},
			'encounter-win': {category: 'default'},
			'enter-floor': {category: 'default'}
		};

		var actionTypes = {
			'encounter': {category: 'default'}
		};
		return {
			event(item){
				_.extend(item, eventTypes[item.type]);
			}, action(item){
				_.extend(item, actionTypes[item.type]);
			}
		}
	});
	app.filter('logType', function () {

	});
	angular.bootstrap(document, ['app']);
});