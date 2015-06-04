function CRCPageCtrlImpl ($scope, $http, $timeout, $mdToast, store) {
	var templateWord = {
		className: "",
		description: "",
		superClass: "",
		responsibilities: [],
		collaborators: []
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
		if ($scope.wordForm.className) {
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
		$http.get('partials/crc.tex').success(function (source) {
			var template = Handlebars.compile(source);
			var words = $scope.words;
			var content = template({words: words});

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
		// $scope.sort();
		store.save({key: 'crc', words: $scope.words});
	};

	$scope.load = function() {
		store.get('crc', function (data) {
			if (data) {
				$scope.words = data.words;
			} else {
				$scope.words = [];
			}
		});
	};

	$scope.load();
}

function CRCPageCtrl ($scope, $http, $timeout, $mdToast) {
	var store =  new Lawnchair({name:'docgen'}, function(store) {
		CRCPageCtrlImpl($scope, $http, $timeout, $mdToast, this);
	});
}

app.controller('CRCPageCtrl',['$scope', '$http', '$timeout', '$mdToast', CRCPageCtrl]);
