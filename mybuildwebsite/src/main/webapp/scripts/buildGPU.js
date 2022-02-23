// Author: Peter Monks
// Version 1.1

// handle build update response and get next component
function showGPUOptions(response) {
	console.log(response);
	$("#savingIndicator").hide();
	if (response.status !== 200) {
		if (response.status === 400) {
			$('#buildErrorIndicator').show();
		} else {
			$('#buildErrorIndicator').show();
		}
	} else {
		$("#loadingIndicator").show();
		componentIndex = 4;
		previousPrice = 0;
		getGPUOptions();
	}
}

// request component options
function getGPUOptions() {
	console.log("Selecting component index: " + componentIndex + " GPU");
	const resourcePath = "product/type/gpu/" + usage + "/" + budget;
	console.log(resourcePath);
	ajaxGet(resourcePath, "json");
}

// receive component results from response
function showGPUResults(response) {
	console.log(response);
	$("#loadingIndicator").hide();
	
	if (response.status !== 200 && response.status !== 400) {
		if (response.status === 401) {
			resetUser();
		} else {
			$('#buildErrorIndicator').show();
		}
	} else {
		console.log(response.responseJSON);
		gpuData = response.responseJSON;
		$("#gpuOptions").show();
		$("#gpuOptionsTable").show();
		let list = makeGPUList();
		$("#gpuOptionsTable").html(list);
	}
}

// display component results
function makeGPUList() {
	let result = listGPUStartTags();
	if (gpuData === undefined) {
		result = "<h4>" + noComponentResultsMessage + "</h4>";
	} else {
		result += listGPUItemsJSON();
	}
	result += listGPUEndTags();
	return result;
}

// table headers with usability information
function listGPUStartTags() {
	return("<div>"
		//+ "<table>"
		+ "<table class=\"table\">"
		+ "<tr>"
		+ "<th title=\"Component description\">Description</th>"
		
		// + "<th>Category</th>"
		+ "<th title=\"The number of operations the GPU can perform per second; the higher the speed the better!\">Base Clock (GHz)</th>"
		+ "<th title=\"The capacity of graphics data (measured in gigabytes) which can be worked on by the GPU; the more the better!\">RAM Capacity (GB)</th>"
		+ "<th title=\"The rate at which graphics data can be processed; the higher the better!\">RAM DDR</th>"
		+ "<th title=\"The number of cores determines how many graphics operations can be processed at the same time; the more the better!\">Cores</th>"
		
		+ "<th title=\"Price including VAT\">Price &pound;</th>"
		+ "<th title=\"Current stock of component\">Stock</th>"
		+ "<th>Select</th>"
		+ "</tr>");
}

// table end tags
function listGPUEndTags() {
	return("</table></div>");
}

// generate table content for each component result line
function listGPUItemsJSON() {
	result = "";
	for(let index = 0; index < gpuData.length; index++) {
	
		// generate additional line information from each component result
		const gpuGhz = gpuData[index].gpu_base_clock / 1000;
		const linePrice = valuePlusVAT(gpuData[index].product_price);
		
		result += "<tr>"
			+ "<td>" + gpuData[index].product_description + "</td>"
			// + "<td>" + gpuData[index].gpu_category + "</td>"
			+ "<td>" + Number(gpuGhz).toFixed(2) + "</td>"
			+ "<td>" + gpuData[index].gpu_ram_capacity + "</td>"
			+ "<td>" + gpuData[index].gpu_ram_ddr + "</td>"
			+ "<td>" + gpuData[index].gpu_cores + "</td>"
			+ "<td>" + Number(linePrice).toFixed(2) + "</td>"
			+ "<td>" + gpuData[index].product_stock + "</td>";
		
		// show select button if in stock, or message if out of stock
		if (parseInt(gpuData[index].product_stock) == 0) {
			result += "<td>" + noStockMessage + "</td>";
		} else {
			result += "<td><input type=\"radio\" id=\"gpu" + index +"\" name=\"gpu\" value=\"" + index + "\" onclick=\"selectGPU()\"></td>";
		}
		
		result += "</tr>";	
	}
	return result;	
}

// get selected component and update total build price
function selectGPU() {
	$('#gpuSelectButton').show();
	selectedGPU = document.querySelector('input[name="gpu"]:checked').value;
	console.log("Selected GPU: " + gpuData[selectedGPU].product_description);
	updateBuildHeaderTotal(gpuData[selectedGPU].product_price);
}

// request update build with component selection,
// store any values for next selections and update power requirement total
function addGPUToBuild() {
	console.log("Updating build with GPU index: " + selectedGPU);
	buildTotalExclVAT += gpuData[selectedGPU].product_price;
	powerRequired += gpuData[selectedGPU].product_wattage;
	const id = localStorage.getItem("build_id");
	const path = "build/" + id;

	var jsonString = '{"build_id":"' + id
		+ '","customer_id":"' + localStorage.getItem("id")
		+ '","build_status":"' + buildStatusOpen
		+ '","build_flag_usage":"' + usage
		+ '","build_flag_budget":"' + budget
		+ '","build_delivery_charge":"' + deliveryCharge
		+ '","build_total":"' + Number(buildTotalExclVAT).toFixed(2)
		+ '","product_id":"' + gpuData[selectedGPU].product_id
		+ '","build_line_product_type":"' + gpuData[selectedGPU].product_type
		+ '","build_line_product_description":"' + gpuData[selectedGPU].product_description
		+ '","build_line_price":"' + gpuData[selectedGPU].product_price
		+ '","build_line_quantity":"' + defaultQuantity
		+ '"}';
	console.log(jsonString);
	$("#gpuOptions").hide();
	$("#savingIndicator").show();
	ajaxPut(path, jsonString, "application/json");
}
