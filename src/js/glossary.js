function GlossaryPageCtrlImpl ($scope, $http, $timeout, $mdToast, store) {
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
