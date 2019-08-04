//=======================================================
// Variable definitions

var started = false;
var done = false;
var rst = false;
var interval;
var flashInterval;
var sec = 0;
var min = 0;
var activityData = [];
var noTable = true;
var phase = 'input';




//=======================================================
// c3.js chart
var chartData = {
	xs: {
		'Temp/Time': 'x1',
		'First Crack': 'x2',
		'Second Crack': 'x3'
	},
	columns: [
		['x1'],
		['x2'],
		['x3'],
		['Temp/Time'],
		['First Crack'],
		['Second Crack']
	],
	type: 'spline'
}

function reloadChart(){
	var chart = c3.generate({
		bindto: '#chart',
		data: chartData,
		axis: {
			x: {
				label: 'Minutes'
			},
			y: {
				label: 'Temperature'
			}
		},
		point: {
			r: 3
		},
		color: {
			pattern: ['#1b72af', '#ffa500', '#ffff00']
		}
	});
}


//=======================================================
// Function definitions

// Get current date as string: 'mm/dd/yyyy'
function getDate(){
	var today = new Date();
	var dd = today.getDate();
	var mm = today.getMonth()+1;
	var yyyy = today.getFullYear();

	if(dd<10){
		dd = '0'+dd;
	}

	if(mm<10){
		mm = '0'+mm;
	}

	return `${mm}/${dd}/${yyyy}`;
}

// Format time for timer
function timeFormat(){
	return `${String(min).padStart(2,0)}:${String(sec).padStart(2,0)}`;
}

// Get data
function getData(){
	var date = document.getElementById('date').value;
	var batch = document.getElementById('batch').value;
	var roaster = document.getElementById('roaster').value;
	var origin = document.getElementById('origin').value;
	var mass = document.getElementById('mass').value + ' grams';
	document.getElementById('date').value = getDate();
	document.getElementById('batch').value = '';
	document.getElementById('roaster').value = '';
	document.getElementById('origin').value = '';
	document.getElementById('mass').value = '';
	activityData.push({
		date: date,
		batch: batch,
		roaster: roaster,
		origin: origin,
		mass: mass
	});
}

// Display data
function toggleDisplayData(tog){
	var div = document.getElementById('output');
	if(tog){
		var tbl = document.createElement('table');
		for(i in activityData[0]){
			var tr = document.createElement('tr');
			var td1 = document.createElement('td');
			var td2 = document.createElement('td');
			td2.setAttribute('class','left-align');
			td1.appendChild(document.createTextNode(`${firstLetterCap(i)}:`));
			td2.appendChild(document.createTextNode(`${activityData[0][i]}`));
			tr.appendChild(td1);
			tr.appendChild(td2);
			tbl.appendChild(tr);
		}
		div.appendChild(tbl);
	}else{
		while(div.firstChild){
			div.removeChild(div.firstChild);
		}
	}
}

// Toggle visibility of input section
function toggleInput(tog){
	if(tog){
		document.getElementById('roast-data').innerHTML = `
		<table id='input-table' type='number' width='300px' border='0'>
			<tr>
				<td>Date</td>
				<td><input class='input' id='date' size='12px' value='${getDate()}'></td>
			</tr>
			<tr>
				<td>Batch Name</td>
				<td><input class='input' id='batch'size='12px'></td>
			</tr>
			<tr>
				<td>Roaster</td>
				<td><input class='input' id='roaster'size='12px'></td>
			</tr>
			<tr>
				<td>Bean Origin</td>
				<td><input class='input' id='origin'size='12px'></td>
			</tr>
			<tr>
				<td>Mass (g)</td>
				<td><input class='input' id='mass'size='12px'></td>
			</tr>
		</table>
		`;
		toggleRoastAgain(tog);
		document.getElementById('batch').focus();
	} else {
		document.getElementById('roast-data').innerHTML = '';
	}
}

// Toggle visibility of timer
function toggleTimer(tog){
	if(tog){
		var tmr = document.createElement('p');
		tmr.setAttribute('id','timer');
		tmr.appendChild(document.createTextNode(timeFormat()));
		document.getElementById('roast-tracker').appendChild(tmr);
	}else{
		var par = document.getElementById('roast-tracker');
		if(par.lastChild){
			par.removeChild(par.lastChild);
		}
	}
}

// Toggle get started/roast again button
function toggleRoastAgain(tog){
	if(activityData = []){
		// Create 'let's roast!' button
		var btn = document.createElement('button');
		btn.setAttribute('id','input-button');
		btn.appendChild(document.createTextNode("Let's Roast!"));
		document.getElementById('roast-data').appendChild(btn);
	}else if(tog){
		// Roast again button
		if(document.getElementById('input-button')){
			document.getElementById('input-button').innerText = 'Roast Again';
		}else{
			var btn = document.createElement('button');
			btn.setAttribute('id','input-button');
			btn.appendChild(document.createTextNode("Roast Again"));
			document.getElementById('roast-data').appendChild(btn);
		}
	}else{
		// Remove button
		var btn = document.getElementById('input-button');
		if(document.getElementById('input-button')){
			document.getElementById('roast-data').removeChild(btn);
		}
	}
}

// Toggle start/stop button
function toggleStartStop(action){
	if(action == 'start'){
		// show start button
		var startButton = document.createElement('button');
		startButton.setAttribute('id','start-button');
		startButton.appendChild(document.createTextNode('Start Roast'));
		document.getElementById('roast-tracker').appendChild(startButton);
	}else if(action == 'stop'){
		// remove start button, show stop button
		var stopButton = document.createElement('button');
		var startButton = document.getElementById('start-button');
		stopButton.setAttribute('id','stop-button');
		stopButton.appendChild(document.createTextNode('Stop Roast'));
		document.getElementById('roast-tracker').removeChild(startButton);
		document.getElementById('roast-tracker').appendChild(stopButton);
	}else if(action == 'none'){
		// remove stop button
		var node = document.getElementById('roast-tracker');
		var tmr = document.getElementById('timer');
		while(node.firstChild && node.firstChild != tmr){
			if(node.firstChild != tmr){
				node.removeChild(node.firstChild);
			}
		}
	}
}

// Toggle visibility of tracker buttons
function toggleTrackerButtons(tog){
	if(tog){
		document.getElementById('tracker-buttons').innerHTML = '';
		var tbl = document.createElement('table');
		tbl.setAttribute('id','tracker-button-table');
		tbl.setAttribute('width','300px');
		tbl.setAttribute('border','0px');
		var tr1 = document.createElement('tr');
		tr1.setAttribute('id','tr1');
		var tr2 = document.createElement('tr');
		tr2.setAttribute('id','tr2');
		var td1 = document.createElement('td');
		var input = document.createElement('input');
		input.setAttribute('id','temp-input');
		input.setAttribute('size','8px');
		td1.appendChild(input);
		var td2 = document.createElement('td');
		var btn1 = document.createElement('button');
		btn1.setAttribute('id','temp-button');
		btn1.setAttribute('style','width:128px');
		btn1.appendChild(document.createTextNode('Add Temp'));
		td2.appendChild(btn1);
		var td3 = document.createElement('td');
		var btn2 = document.createElement('button');
		btn2.setAttribute('id','first-crack');
		btn2.setAttribute('style','width:128px');
		btn2.appendChild(document.createTextNode('1st Crack'));
		td3.appendChild(btn2);
		var td4 = document.createElement('td');
		var btn3 = document.createElement('button');
		btn3.setAttribute('id','second-crack');
		btn3.setAttribute('style','width:128px');
		btn3.appendChild(document.createTextNode('2nd Crack'));
		td4.appendChild(btn3);
		tr1.appendChild(td1);
		tr1.appendChild(td2);
		tr2.appendChild(td3);
		tr2.appendChild(td4);
		tbl.appendChild(tr1);
		tbl.appendChild(tr2);
		document.getElementById('tracker-buttons').appendChild(tbl);
	}else{
		var node = document.getElementById('tracker-buttons');
		while(node.firstChild){
			node.removeChild(node.firstChild);
		}
	}
}

function toggleResetButton(tog){
	if(tog){
		var node = document.getElementById('reset');
		while(node.firstChild){
			node.removeChild(node.firstChild);
		}		
		var rst = document.createElement('button');
		rst.setAttribute('id','reset-button');
		rst.appendChild(document.createTextNode('Reset Tracker'));
		document.getElementById('reset').appendChild(rst);
	}else{
		var node = document.getElementById('reset');
		while(node.firstChild){
			node.removeChild(node.firstChild);
		}
	}
}

function toggleSpacer(tog){
	if(tog){
		document.getElementById('bar').setAttribute('style', 'width=50px');
	}else{
		document.getElementById('bar').setAttribute('style', 'width=0px');
	}
}

// start timer
function startTimer(){
	if(started == false){
		started = true;
		
		interval = setInterval(function(){
			if(sec == 59){
				sec = 0;
				min += 1;
			} else {
				sec += 1;
			}
			document.getElementById('timer').innerHTML = timeFormat();
		}, 1000);
	}
}

// stop timer
function stopTimer(){
	clearInterval(interval);
	if(!rst){
		flashTimer(timeFormat());
	}
	sec = 0;
	min = 0;
	started = false;
	done = true;
}

// create flashing time when clock is stopped
function flashTimer(time){
	var toggle = true;
	if(document.getElementById('timer')){
		flashInterval = setInterval(function(){
			var tmr = document.getElementById('timer');
			if(toggle){
				while(tmr.firstChild){
					tmr.removeChild(tmr.firstChild);
				}
				var txt = document.createElement('div');
				txt.setAttribute('style','color:white');
				txt.appendChild(document.createTextNode(`Ended at ${time}`));
				tmr.appendChild(txt);
				toggle = false;
			}else if(!toggle){
				while(tmr.firstChild){
					tmr.removeChild(tmr.firstChild);
				}
				var txt = document.createElement('div');
				txt.setAttribute('style','color:#cccccc');
				txt.appendChild(document.createTextNode(`Ended at ${time}`));
				tmr.appendChild(txt);
				toggle = true;
			}
		}, 500);
	}
}

// create activity table
function createActivityTable(){
	var tbl = document.createElement('table');
	tbl.setAttribute('id','activity-table');
	tbl.setAttribute('width','300px');
	tbl.setAttribute('border','0px');
	var tr = document.createElement('tr');
	var th1 = document.createElement('th');
	th1.appendChild(document.createTextNode('Time'));
	var th2 = document.createElement('th');
	th2.appendChild(document.createTextNode('Temp'));
	var th3 = document.createElement('th');
	th3.appendChild(document.createTextNode('Activity'));
	tr.appendChild(th1);
	tr.appendChild(th2);
	tr.appendChild(th3);
	tbl.appendChild(tr);
	document.getElementById('activity-data').appendChild(tbl);
}

// update activity table
function updateActivityTable(activity){
	var time = timeFormat();
	var temp = document.getElementById('temp-input').value;
	updateActivityData(time,temp,activity);
	
	var tr = document.createElement('tr');
	// set id so they can be deleted
	var td1 = document.createElement('td');
	td1.appendChild(document.createTextNode(time));
	var td2 = document.createElement('td');
	td2.appendChild(document.createTextNode(temp));
	var td3 = document.createElement('td');
	td3.appendChild(document.createTextNode(activity));
	tr.appendChild(td1);
	tr.appendChild(td2);
	tr.appendChild(td3);
	document.getElementById('activity-table').appendChild(tr);
}

function removeActivityTable(){
	var div = document.getElementById('activity-data');
	while(div.firstChild){
		div.removeChild(div.firstChild);
	}
}

function updateActivityData(time, temp, activity){
	activityData.push({
		time: time,
		temp: temp,
		activity: activity
	});
}

function updateChartData(action){
	var time = timeFormat();
	var temp = document.getElementById('temp-input').value;
	if(action == '1st Crack'){
		chartData.columns[1].push(convertTimetoFloat(time));
		chartData.columns[4].push(parseInt(temp));
	}else if(action == '2nd Crack'){
		chartData.columns[2].push(convertTimetoFloat(time));
		chartData.columns[5].push(parseInt(temp));
	}
	chartData.columns[0].push(convertTimetoFloat(time));
	chartData.columns[3].push(parseInt(temp));
}

function convertTimetoFloat(time){
	var min = parseInt(time[0]+time[1]);
	var sec = parseInt(time[3]+time[4]);
	return parseFloat(min + (sec/60)).toFixed(1);
}

function clearTempInput(){
	document.getElementById('temp-input').value = '';
	document.getElementById('temp-input').focus();
}

function inputButtonAction(){
	done = false;
	started = false;
	getData();
	toggleInput(false);
	toggleDisplayData(true);
	toggleStartStop('start');
	toggleResetButton(true);
	phase = 'confirm';
}

function startButtonAction(){
	reloadChart();
	rst = false;
	toggleStartStop('stop');
	toggleTimer(true);
	startTimer();
	toggleTrackerButtons(true);
	createActivityTable();
	document.getElementById('temp-input').focus();
	toggleSpacer(true);
	phase = 'started';
}

function stopButtonAction(){
	started = false;
	stopTimer();
	toggleStartStop('none');
	toggleTrackerButtons();
	done = true;
	phase = 'stopped';
}

function resetButtonAction(){
	rst = true;
	clearInterval(flashInterval);
	phase = 'input';
	toggleDisplayData();
	toggleStartStop('none');
	stopTimer();
	toggleTimer();
	toggleTrackerButtons();
	removeActivityTable();
	toggleInput(true);
	resetChartData();
}

function resetChartData(){
	chartData = {
		xs: {
			'Temp/Time': 'x1',
			'First Crack': 'x2',
			'Second Crack': 'x3'
		},
		columns: [
			['x1'],
			['x2'],
			['x3'],
			['Temp/Time'],
			['First Crack'],
			['Second Crack']
		]
	}
}

function tempButtonAction(){
	updateActivityTable('');
	updateChartData();
	reloadChart();
}

function crackButtonAction(type){
	var crack;
	if(type == 'first-crack'){
		crack = '1st Crack';
		var row = document.getElementById('tr2');
		row.removeChild(row.firstChild);
	}else{
		crack = '2nd Crack';
		var row = document.getElementById('tr2');
		while(row.firstChild){
			row.removeChild(row.firstChild);
		}
	}
	updateActivityTable(crack);
	updateChartData(crack);
	reloadChart();
}

function clearInputFocus(id){
	setTimeout(function(){
		document.getElementById(id).value = '';
		document.getElementById(id).focus();
	},0);
}


function firstLetterCap(string){
	return string.charAt(0).toUpperCase() + string.slice(1);
}


//=======================================================
// Initial Commands

// run when page loads
function onLoad(){
	toggleInput(true);
	document.getElementById('date').value = getDate();
	//document.getElementById('myChart').setAttribute('style','height:0px');
}

onLoad();


//=======================================================
// Listener definitions

// Keyboard listener
document.addEventListener('keydown',function(event){
	var key = event.which || event.keyCode;
	var inputButton = document.getElementById('input-button');
	var startButton = document.getElementById('start-button');
	var stopButton = document.getElementById('stop-button');
	var tempButton = document.getElementById('temp-button');
	var resetButton = document.getElementById('reset-button');
	if(key == 82 && document.body.contains(resetButton)){
		resetButtonAction();
		clearInputFocus('batch');
	}else if(key == 27 && document.body.contains(stopButton)){
		stopButtonAction();
	}else if(document.body.contains(inputButton) && key == 13){
		inputButtonAction();
	}else if(document.body.contains(startButton) && key == 13){
		startButtonAction();
	}else if(document.body.contains(tempButton)){
		if(key == 13){
			tempButtonAction();
			clearInputFocus('temp-input');
		}else if(key == 70){
			crackButtonAction('first-crack');
			clearInputFocus('temp-input');
		}else if(key == 83){
			crackButtonAction('second-crack');
			clearInputFocus('temp-input');
		}
	}
});

// Click listener
document.addEventListener('click',listenerFunc);
function listenerFunc(event){
	var elem = event.target;
	if(elem.id == 'input-button'){
		inputButtonAction();
	}else if(elem.id == 'start-button'){
		startButtonAction();
	}else if(elem.id == 'stop-button'){
		stopButtonAction();
	}else if(elem.id == 'temp-button'){
		tempButtonAction();
	}else if(elem.id == 'first-crack' || elem.id == 'second-crack'){
		crackButtonAction(elem.id);
	}else if(elem.id == 'reset-button'){
		resetButtonAction();
	}
}

// Notes:
// - still need to figure out how to block non-number input on temp input.