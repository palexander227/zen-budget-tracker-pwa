let transactions = [];
let myChart;
let temp = [];
let localTransactions = [];
let connectionFlag = false;
const BASE_URL = "";
window.addEventListener('online', sync);

function addTransactionIntoLocalDB(trData) {
	localStorage.setItem('localDb', JSON.stringify(trData));
};

async function sync() {
	let localData = getTransactionFromLocalDB();
	if (window.navigator.onLine && localData) {
		const syncData = localData.filter(p => p.sync === false);
		if (syncData && syncData.length) {
			try {
				await addLocalTransactionsToSeverDb(syncData.map(({ sync, ...p }) => p));
				localData = localData.filter(p => !p.sync).map(p => ({ ...p, sync: true }));
				fetch(`${BASE_URL}api/transaction`).then(response => {
					return response.json();
				}).then(res => {
					addTransactionIntoLocalDB(res);
				});
			} catch (er) {
				console.log(er);
			}
		}
	}
};

function addLocalTransactionsToSeverDb(lcTrans) {
	return fetch(`${BASE_URL}api/transaction/bulk`, {
		method: "POST",
		body: JSON.stringify(lcTrans),
		headers: {
			Accept: "application/json, text/plain, */*",
			"Content-Type": "application/json"
		}
	});
};

function addTransactionIntoLocal(lcTrans) {
	let relcTrans = lcTrans.reverse();
	relcTrans.forEach(transaction => {
		transactions.unshift(transaction);
	});
}

function getTransactionFromLocalDB() {
	const localTransactions = JSON.parse(localStorage.getItem('localDb'));
	return localTransactions;
}


setTimeout(function () {
	sync();
	fetch(`${BASE_URL}api/transaction`).then(response => {
		if (response.status == 200) {
			connectionFlag = true;
			return response.json();
		} else {
			connectionFlag = false;
			return response.json();
		}
	})
		.then(data => {
			if (connectionFlag) {
				const oldTransaction = getTransactionFromLocalDB();
				if (oldTransaction) {
					data = oldTransaction.filter(p => {
						if (!p._id) return true;
						return !data.find(s => s._id === p._id);
					}).concat(data);
				}
				transactions = data;
				addTransactionIntoLocalDB(transactions);
				populateTotal();
				populateTable(transactions);
				populateChart();
				console.log('init Connection success----------------------')
			} else {
				// fetch failed, so save in indexed db
				const localTransactions = getTransactionFromLocalDB();
				if (localTransactions) {
					transactions = localTransactions;
					populateTotal();
					populateTable(transactions);
					populateChart();
				}
				console.log('init Connection failure----------------------');
			}
		})
		.catch(err => {
			// fetch failed, so save in indexed db
			const localTransactions = getTransactionFromLocalDB();
			if (localTransactions) {
				transactions = localTransactions;
				populateTotal();
				populateTable(localTransactions);
				populateChart();
			}
			console.log('init Connection failure-----------');
		});
}, 0);

function populateTotal() {
	// reduce transaction amounts to a single total value
	let total = transactions.reduce((total, t) => {
		return total + parseInt(t.value);
	}, 0);

	let totalEl = document.querySelector("#total");
	totalEl.textContent = total;
}

function populateTable(_transactions) {
	let tbody = document.querySelector("#tbody");
	tbody.innerHTML = "";
	_transactions.forEach(transaction => {
		// create and populate a table row
		let tr = document.createElement("tr");
		tr.innerHTML = `
      <td>${transaction.name}</td>
      <td>${transaction.value}</td>
    `;

		tbody.appendChild(tr);
	});
}

function populateChart() {
	// copy array and reverse it
	let reversed = transactions.slice().reverse();
	let sum = 0;

	// create date labels for chart
	let labels = reversed.map(t => {
		let date = new Date(t.date);
		return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
	});

	// create incremental values for chart
	let data = reversed.map(t => {
		sum += parseInt(t.value);
		return sum;
	});

	// remove old chart if it exists
	if (myChart) {
		myChart.destroy();
	}

	let ctx = document.getElementById("myChart").getContext("2d");

	myChart = new Chart(ctx, {
		type: 'line',
		data: {
			labels,
			datasets: [{
				label: "Total Over Time",
				fill: true,
				backgroundColor: "#6666ff",
				data
			}]
		}
	});
}

function storeTransaction(_transaction) {
	//alert(Object.values(_transaction));
	let jsonString = localStorage.getItem('localDb');
	if (jsonString) {
		localTransactions = JSON.parse(jsonString);
	}
	localTransactions.unshift(_transaction);
	localStorage.setItem('localDb', JSON.stringify(localTransactions));
	transactions = localTransactions;
	populateTotal();
	populateTable(transactions);
	populateChart();
}

function sendTransaction(isAdding) {
	if (!transactions) transactions = [];
	let nameEl = document.querySelector("#t-name");
	let amountEl = document.querySelector("#t-amount");
	let errorEl = document.querySelector(".form .error");

	// validate form
	if (nameEl.value === "" || amountEl.value === "") {
		errorEl.textContent = "Missing Information";
		return;
	} else {
		errorEl.textContent = "";
	}

	// create record
	let transaction = {
		name: nameEl.value,
		value: amountEl.value,
		date: new Date().toISOString()
	};

	// if subtracting funds, convert amount to negative number
	if (!isAdding) {
		transaction.value *= -1;
	}
	// add to beginning of current array of data
	transactions.unshift(transaction);

	function response() {
		fetch(`${BASE_URL}api/transaction`, {
			method: "POST",
			body: JSON.stringify(transaction),
			headers: {
				Accept: "application/json, text/plain, */*",
				"Content-Type": "application/json"
			}
		}).then(response => {
			if (response.status == 200) {
				connectionFlag = true;
				return response.json();
			} else {
				connectionFlag = false;
				return response.json();
			}
		})
			.then(data => {
				if (connectionFlag) {
					// clear form
					nameEl.value = "";
					amountEl.value = "";
					storeTransaction(data);
					populateChart();
					populateTable(transactions);
					populateTotal();
					console.log('click Connection success-------------');
				} else {
					nameEl.value = "";
					amountEl.value = "";
					storeTransaction({ ...transaction, sync: false });
					console.log('click Connection error------------------');
				}
			})
			.catch(err => {
				// clear form
				connectionFlag = false;
				nameEl.value = "";
				amountEl.value = "";
				storeTransaction({ ...transaction, sync: false });
				console.log('click Connection error------------------1');
			});

	}

	setTimeout(response, 0);
}

document.querySelector("#add-btn").onclick = function () {
	sendTransaction(true);
};

document.querySelector("#sub-btn").onclick = function () {
	sendTransaction(false);
};
