var app = angular.module('myApp');

function UseCasePageCtrlImpl ($scope, $http, $timeout, $mdDialog, store) {
	$scope.dragEnabled = true;
	
	$scope.data = {};

	var configCache = {};
	$scope.configFactory = function (subsystemIndex) {
		if (configCache[subsystemIndex]) {
			return configCache[subsystemIndex];
		}

		var newConfig =  {
			group: "subsystems",
			index: subsystemIndex,
			disabled: !$scope.dragEnabled,
			onSort: function(event) {
				var models = event.models;				
				$timeout(function() {
					$scope.save();
				});
			}
		};

		configCache[subsystemIndex] = newConfig;
		return newConfig;
	};

	$scope.openUsecaseForm = function (usecase) {
		return $mdDialog.show({
			templateUrl: 'partials/usecase_dialog.html',
			locals: {
				usecase: usecase
			},
			controller: 'UseCaseDetailsCtrl'
		});
	};

	$scope.openUsecase = function (usecase) {
		$scope.openUsecaseForm(usecase).then(function() {
			$scope.save();
		});
	};

	$scope.newUsecase = function (subsystem) {
		var usecase = { 
			title: '', 
			description: '', 
			primaryActors: [],
			secondaryActors: [],
			preconditions: [],
			postconditions: [],
			mainflow: [],
			alternatives: []
		};

		$scope.openUsecaseForm(usecase).then(function() {
			subsystem.usecases.push(usecase);
			$scope.save();
		});
	};

	$scope.newSubsystem = function () {
		if (!$scope.data.subsystems) {
			$scope.data.subsystems = [];
		}

		$scope.data.subsystems.push({name: $scope.newSubsystemName, usecases: []});
		$scope.newSubsystemName = "";
		$scope.save();
	};

	$scope.deleteSubsystem = function (subsystem) {
		var confirm = $mdDialog.confirm()
						.content("You sure you want to delete " + subsystem.name + "?")
						.ok("Yes")
						.cancel("No");
		$mdDialog.show(confirm).then(function () {
			var index = $scope.data.subsystems.indexOf(subsystem);
			if (index !== -1) {
				$scope.data.subsystems.splice(index, 1);
			}
		});
	};

	$scope.openEditDialog = function () {
		return $mdDialog.show({
			templateUrl: 'partials/usecase_edit.html',
			locals: {
				data: $scope.data
			},
			controller: 'UseCaseEditJSONCtrl'
		}).then(function (data) {
			$scope.data = data;
			$scope.save();
		});
	};

	$scope.openSnippetEditDialog = function () {
		return $mdDialog.show({
			templateUrl: 'partials/usecase_edit.html',
			locals: {
				data: $scope.data.snippets
			},
			controller: 'UseCaseEditJSONCtrl'
		}).then(function (data) {
			$scope.data.snippets = data;
			$scope.save();
		});
	};


	$scope.renderSubsystems = function() {
		var snippets = $scope.data.snippets;

		function getSnippet(val) {
			if (val && val[0] == '@') {
				var strParts = val.split(" ");
				var snippet = angular.copy(snippets[strParts[0].slice(1)]);
				if (snippet) {
					for (var i = 1; i < strParts.length; i++) {
						snippet = replace(snippet, "@" + i, strParts[i]);
					}	
					return snippet;
				}
			}
		}

		function replace(part, k, v) {
			if (typeof(part) == "string") {
				var re = new RegExp(k, 'g');
				return part.replace(re, v);
			} else if (typeof(part) == 'object') {
				for (var key in part) {
					part[key] = replace(part[key], k, v);	
				}
				return part;
			}
			return part;
		}

		function renderPart(part) {
			if (typeof(part) == "string") {
				var snip = getSnippet(part);
				if (snip) {
					return renderPart(snip);
				}
				return part;
			} else if (typeof(part) == 'object') {
				for (var key in part) {
					part[key] = renderPart(part[key]);	
				}
				return part;
			}
			return part;
		}

		return renderPart(angular.copy($scope.data.subsystems));
	};

	$scope.createTexLink = function () {
		$http.get('partials/usecase.tex').success(function (source) {
			var template = Handlebars.compile(source);
			var subsystems = $scope.renderSubsystems();
			console.log(subsystems);
			var content = template({subsystems: subsystems});

			$scope.texContent = content;
			// var win = window.open("", "Title", "toolbar=no, location=no, directories=no, status=no, menubar=no, scrollbars=yes, resizable=yes, width=780, height=200, top="+(screen.height-400)+", left="+(screen.width-840));
			// win.document.body.innerHTML = "<p>" + content + "</p>";
			$scope.texLink =  encodeURIComponent(content);
		});
	};

	$scope.clearTexLink = function () {
		$scope.texLink = "";
	};

	$scope.save = function () {
		store.save({key: 'subsystems', subsystems: $scope.data.subsystems, snippets: $scope.data.snippets});
	};

	$scope.load = function() {
		store.get('subsystems', function (data) {
			if (data) {
				$scope.data.subsystems = data.subsystems;
				$scope.data.snippets = data.snippets;
			} else {
				$scope.data = {
					subsystems: [],
					snippets: {}
				};
			}
		});
	};

	$scope.load();
}

function UseCasePageCtrl ($scope, $http, $timeout, $mdDialog) {
	$scope.testlist = ["hasdsad", "asdad", 'asd'];
	var store =  new Lawnchair({name:'usecase'}, function(store) {
		UseCasePageCtrlImpl($scope, $http, $timeout, $mdDialog, this);
	});
}

function UseCaseDetailsCtrl ($scope, $mdDialog, usecase) {
	$scope.usecase = usecase;

	$scope.addPrecondition = function (event) {
		var precondition = event.target.value;
		event.target.value = "";
		$scope.usecase.preconditions.push(precondition);
	};

	$scope.removePrecondition = function (itemIndex) {
		$scope.usecase.preconditions.splice(itemIndex, 1);
	};

	$scope.addPostcondition = function (event) {
		var postcondition = event.target.value;
		event.target.value = "";
		$scope.usecase.postconditions.push(postcondition);
	};

	$scope.removePostcondition = function (itemIndex) {
		$scope.usecase.postconditions.splice(itemIndex, 1);
	};

	$scope.addAlternative = function (event) {
		var alternative = event.target.value;
		event.target.value = "";
		$scope.usecase.alternatives.push(alternative);
	};

	$scope.removeAlternative = function (itemIndex) {
		$scope.usecase.alternatives.splice(itemIndex, 1);
	};

	$scope.addFlow = function (event, parentFlow) {
		var flow = event.target.value;
		event.target.value = "";

		if (parentFlow) {
			parentFlow.subflow.push({text: flow});
		} else {
			$scope.usecase.mainflow.push({text: flow});
		}
	};

	$scope.removeFlow = function (index, parentFlow) {
		if (parentFlow) {
			parentFlow.subflow.splice(index, 1);
		} else {
			$scope.usecase.mainflow.splice(index, 1);
		}
	};

	$scope.saveAndClose = function () {
		$mdDialog.hide();
	};
}

function UseCaseEditJSONCtrl ($scope, $mdDialog, $mdToast, data) {
	$scope.jsonData = angular.toJson(data, 4);

	$scope.saveAndClose = function () {
		try {
			var data = angular.fromJson($scope.jsonData);		
			$mdDialog.hide(data);
		} catch(e) {
			$mdToast.show($mdToast.simple().content('Invalid JSON string'));
		}	
	};

	$scope.close = function () {
		$mdDialog.cancel();
	};
}

app.controller('UseCasePageCtrl',['$scope', '$http', '$timeout', '$mdDialog', UseCasePageCtrl]);
app.controller('UseCaseDetailsCtrl',['$scope', '$mdDialog', 'usecase', UseCaseDetailsCtrl]);
app.controller('UseCaseEditJSONCtrl',['$scope', '$mdDialog', '$mdToast', 'data', UseCaseEditJSONCtrl]);