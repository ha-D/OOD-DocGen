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

Handlebars.registerHelper('inc', function(val) {
  	return val + 1;
});