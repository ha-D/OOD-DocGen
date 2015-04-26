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
