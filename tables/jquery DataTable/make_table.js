var makeTable = function() {
	var data, sort_by, filter_cols; // Customizable variables
		
	// Main function, where the actual plotting takes place.
	function _table(targetDiv) {
	  // Create and select table skeleton
	  var tableSelect = targetDiv.append("table")
			// Generally, hard-coding Ids is wrong, because then 
			// you can't have 2 table plots in one page (both will have the same id).
			// I will leave it for now for simplicity. TODO: remove hard-coded id.
	    .attr("id", "data-table") 
      // .attr("class", "display compact")
	    .attr("class", "order-column compact table table-striped table-bordered")      
	    .style("visibility", "hidden") // Hide table until style loads;
      .style("width", "100%");

	  // Set column names
	  var colnames = Object.keys(data[0]);
		if(typeof filter_cols !== 'undefined'){
			// If we have filtered cols, remove them.
			colnames = colnames.filter(d => filter_cols.indexOf(d) < 0);
		}
		
		// Here I initialize the table and head only. 
		// I will let DataTables handle the table body.
	  var headSelect = tableSelect.append("thead")
	    .append("tr")
	    .selectAll('td')
	    .data(colnames).enter()
		    .append('td')
        .text(d => d);
        


		if(typeof sort_by !== 'undefined'){
			// if we have a sort_by column, format it according to datatables.
			sort_by[0] = colnames.indexOf(sort_by[0]); //colname to col idx
			sort_by = [sort_by]; //wrap it in an array
		}
	
	  // DataTable Manual: https://www.datatables.net/manual
	  $(document).ready(function() {
	    table = $('#data-table').DataTable({
	      data: data,
	      columns: colnames.map(function(d) { return {data: d}; }),
	      "bLengthChange": true, // page length flag
        "lengthMenu": [10, 20, 50],
	      "bDeferRender": true,
	      "order": sort_by,
      });
			
	    tableSelect.style("visibility", "visible");
	  });	
	}
	
	/**** Setter / getters functions to customize the table plot *****/
	_table.datum = function(_){
    if (!arguments.length) {return data;}
    data = _;
    
    return _table;
	};
	_table.filterCols = function(_){
    if (!arguments.length) {return filter_cols;}
    filter_cols = _;
    
    return _table;
	};
	_table.sortBy = function(colname, ascending){
    if (!arguments.length) {return sort_by;}
    
		sort_by = [];
		sort_by[0] = colname;
		sort_by[1] = ascending ? 'asc': 'desc';
    
    return _table;
	};
	
	// This is the return of the main function 'makeTable'
	return _table;
}