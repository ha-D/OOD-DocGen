var app = angular.module('myApp', [
	'ngMaterial',
	'ngRoute',
	'ng-sortable'
]);

app.config(['$routeProvider', function($routeProvider) {
	$routeProvider
	.when('/', { templateUrl: 'partials/usecases.html' });
}]);

app.config( [
    '$compileProvider',
    function( $compileProvider )
    {   
        $compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|ftp|data):/);
    }
]);

app.directive('ngEnter', function () {
    function link (scope, element, attrs) {
        element.bind("keydown keypress", function (event) {
            if(event.which === 13) {
                scope.$apply(function() {
                    scope.ngEnter({event: event});        
                });
                event.preventDefault();
            }
        });
    }

    return {
        link: link,
        scope: {
            ngEnter: "&"
        }
    };
});
;var app = angular.module('myApp');

function UseCasePageCtrlImpl ($scope, $http, $timeout, $mdDialog, store) {

	$scope.subsystems2 = [
		{ 
			name: 'firstsubsystem', 
			usecases: [
				{ 
				  title: 'Login to the system', 
				  description: 'قرار اس از سیستم خروج کند', 
				  primaryActors: ['user'],
				  secondaryActors: [],
				  preconditions: [],
				  postconditions: [],
				  mainflow: [],
				  alternatives: []
				},
				{ 
				  title: 'Logout from the system', 
				  description: 'قرار اس از سیستم خروج کند', 
				  primaryActors: ['user'],
				  secondaryActors: [],
				  preconditions: [],
				  postconditions: [],
				  mainflow: [],
				  alternatives: []
				}
			]
		},
		{ 
			name: 'secondsubsystem',
			usecases: [
				{ 
				  title: 'Do sth important', 
				  description: 'قرار اس از سیستم خروج کند', 
				  primaryActors: ['user'],
				  secondaryActors: [],
				  precondtions: [],
				  postconditions: [],
				  mainflow: [],
				  alternatives: []
				},
				{ 
				  title: 'Explode everything', 
				  description: 'قرار اس از سیستم خروج کند', 
				  primaryActors: ['user'],
				  secondaryActors: [],
				  precondtions: [],
				  postconditions: [],
				  mainflow: [],
				  alternatives: []
				}
			]
		}
	];

	$scope.dragEnabled = true;

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
				console.log($scope.subsystems);
				$timeout(function() {
					$scope.save();
				});
			}
		};

		configCache[subsystemIndex] = newConfig;
		return newConfig;
	};
	

	$scope.createSubSystem = function (name) {
		var subsystem = {
			name: name,
			usecases: []
		};
		$scope.subsystems.push(subsystem);
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
		$scope.subsystems.push({name: $scope.newSubsystemName, usecases: []});
		$scope.newSubsystemName = "";
		$scope.save();
	};

	$scope.deleteSubsystem = function (subsystem) {
		var confirm = $mdDialog.confirm()
						.content("You sure you want to delete " + subsystem.name + "?")
						.ok("Yes")
						.cancel("No");
		$mdDialog.show(confirm).then(function () {
			var index = $scope.subsystems.indexOf(subsystem);
			if (index !== -1) {
				$scope.subsystems.splice(index, 1);
			}
		});
	};

	$scope.openEditDialog = function () {
		return $mdDialog.show({
			templateUrl: 'partials/usecase_edit.html',
			locals: {
				data: $scope.subsystems
			},
			controller: 'UseCaseEditJSONCtrl'
		}).then(function (data) {
			$scope.subsystems = data;
			$scope.save();
		});
	};

	$scope.createTexLink = function () {
		$http.get('partials/usecase.tex').success(function (source) {
			var template = Handlebars.compile(source);
			var content = template({subsystems: $scope.subsystems});
			// var content = template({sub});
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
		store.save({key: 'subsystems', subsystems: $scope.subsystems});
	};

	$scope.load = function() {
		store.get('subsystems', function (data) {
			if (data) {
				$scope.subsystems = data.subsystems;	
			} else {
				$scope.subsystems = [];
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