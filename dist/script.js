var app = angular.module('myApp', [
	'ngMaterial',
	'ngRoute',
	'ng-sortable'
]);

app.config(['$routeProvider', function($routeProvider) {
	$routeProvider
	.when('/usecase', { templateUrl: 'partials/usecases.html' })
    .when('/glossary', { templateUrl: 'partials/glossary.html' });
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
		store.save({key: 'usecase', subsystems: $scope.data.subsystems, snippets: $scope.data.snippets});
	};

	$scope.load = function() {
		store.get('usecase', function (data) {
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
	var store =  new Lawnchair({name:'docgen'}, function(store) {
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
app.controller('UseCaseEditJSONCtrl',['$scope', '$mdDialog', '$mdToast', 'data', UseCaseEditJSONCtrl]);;function GlossaryPageCtrlImpl ($scope, $http, $timeout, $mdToast, store) {
	var templateWord = {
		word: "",
		definition: "",
		synonyms: [],
		antonyms: []
	};
	
	$scope.state = '';

	$scope.manual = {
		content: ''
	};

	$scope.tex = {
		link: '',
		content: ''
	};

	$scope.words = [];
	$scope.wordForm = angular.copy(templateWord);

	$scope.clearForm = function () {
		$scope.wordForm = angular.copy(templateWord);
		$scope.save();
	};

	$scope.addWord = function () {
		if ($scope.wordForm.word) {
			$scope.words.push($scope.wordForm);
			$scope.clearForm();
			$scope.save();
		}	
	};

	$scope.removeWord = function (index) {
		$scope.words.splice(index, 1);
		$scope.save();
	};

	$scope.editWord = function (word) {
		$scope.wordForm = word;
	};

	$scope.manualEditStart = function () {
		$scope.state = 'edit';
		$scope.manual.content = angular.toJson($scope.words, 4);
	};

	$scope.manualEditSave = function () {
		try {
			$scope.words = angular.fromJson($scope.manual.content);
			$scope.save();
		} catch(e) {
			$mdToast.show($mdToast.simple().content('Invalid JSON'));
		}
		$scope.state = '';
	};

	$scope.manualEditCancel = function () {
		$scope.state = '';
	};

	$scope.renderTex = function () {
		function categorize () {
			var cats = {};

			for (var i = 0; i < $scope.words.length; i++) {
				var word = $scope.words[i];
				if (!cats[word.word[0]]) {
					cats[word.word[0]] = [];
				}
				cats[word.word[0]].push(word);
			}

			if (cats['آ']) {
				if (cats['ا']) {
					cats['ا'].push(cats['آ']);
				} else {
					cats['ا'] = cats['آ'];
				}
				delete cats['آ'];
			}

			var catList = [];
			for (var key in cats) {
				catList.push({
					letter: key,
					words: cats[key]
				});
			}

			catList.sort(function (c1, c2) {
				return c1.letter > c2.letter ? 1 : c1.letter < c2.letter ? -1 : 0;
			});

			return catList;
		}

		$http.get('partials/glossary.tex').success(function (source) {
			var template = Handlebars.compile(source);
			var words = $scope.words;
			var content = template({wordCategories: categorize()});

			$scope.tex.content = content;
			$scope.tex.link =  encodeURIComponent(content);
			$scope.state = 'tex';
		});
	};

	$scope.texCancel = function () {
		$scope.tex.link = '';
		$scope.tex.content = '';
		$scope.state = '';
	};

	$scope.sort = function () {
		$scope.words.sort(function (w1, w2) {
			return w1.word > w2.word ? 1 : w1.word < w2.word ? -1 : 0;
		});
	};

	$scope.save = function () {
		$scope.sort();
		store.save({key: 'glossary', words: $scope.words});
	};

	$scope.load = function() {
		store.get('glossary', function (data) {
			if (data) {
				$scope.words = data.words;
			} else {
				$scope.words = [];
			}
		});
	};

	$scope.load();
}

function GlossaryPageCtrl ($scope, $http, $timeout, $mdToast) {
	var store =  new Lawnchair({name:'docgen'}, function(store) {
		GlossaryPageCtrlImpl($scope, $http, $timeout, $mdToast, this);
	});
}

app.controller('GlossaryPageCtrl',['$scope', '$http', '$timeout', '$mdToast', GlossaryPageCtrl]);
;var usecaseIndex = 1;

Handlebars.registerHelper('reset', function() {
  	usecaseIndex = 1;
});

Handlebars.registerHelper('incIndex', function() {
  	usecaseIndex += 1;
});

Handlebars.registerHelper('index', function() {
  	return usecaseIndex;
});

Handlebars.registerHelper('inc', function(val) {
  	return val + 1;
});

Handlebars.registerHelper('flow', function(flows, options) {
	var out = "";
	function addFlow(flows) {
		out += "\\begin{enumerate}[itemsep=0pt,label*=\\arabic*.]\n";

		for(var i=0; i<flows.length; i++) {
			out += "\\item " +  flows[i].text + "\n";
			if (flows[i].subflow && flows[i].subflow.length) {
				addFlow(flows[i].subflow);
			}
		}

		out += "\\end{enumerate}\n";
	}

  	addFlow(flows);
  	return out;
});