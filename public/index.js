let transactions = [];
let myChart;
let temp = [];

// var localDb = [{
//               date: "2021-08-30T18:22:32.339Z",
//               name: "11",
//               value: 1,
//               __v: 0,
//               _id: "612d21e8ca09a12650c08751"    
//             }];
// localStorage.setItem('localDb', JSON.stringify(localDb));
var localDb = JSON.parse(localStorage.getItem('localDb')); 

// let tran2 = [];
// temp.unshift(localDb);

setTimeout(function(){
  fetch("/api/transaction")
    .then(response => {
      if(response.status == 200){
        console.log('success');
        return response.json();
      }
      else if(response.state == 404){
        console.log('error');
        // return response.json();
      }else{
        console.log('error');
        // return response.json();
      }

    })
    .then(data => {
      if (data.errors) {      
        console.log('init data error--------------------');
      }else{
      // save db data on global variable
        transactions = data;      
        console.log(data);
        localStorage.setItem('localDb', JSON.stringify(data));

      }
      populateTotal();
      populateTable();
      populateChart();
      console.log('init success----------------------')
    })
    .catch(err => {
      // fetch failed, so save in indexed db
      transactions = localDb;
      console.log('init catch error--------------------');
      console.log(transactions);

      populateTotal();
      populateTable();
      populateChart();
      // clear form
    });
  }, 1000);

function populateTotal() {
  // reduce transaction amounts to a single total value
  let total = transactions.reduce((total, t) => {
    return total + parseInt(t.value);
  }, 0);

  let totalEl = document.querySelector("#total");
  totalEl.textContent = total;
}

function populateTable() {
  console.log('populateTable')
  let tbody = document.querySelector("#tbody");
  tbody.innerHTML = "";

  transactions.forEach(transaction => {
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

function sendTransaction(isAdding) {
  let nameEl = document.querySelector("#t-name");
  let amountEl = document.querySelector("#t-amount");
  let errorEl = document.querySelector(".form .error");

  // validate form
  if (nameEl.value === "" || amountEl.value === "") {
    errorEl.textContent = "Missing Information";
    return;
  }
  else {
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
  // console.log(transaction);
  transactions.unshift(transaction);
  // tran2.unshift(transaction);

  // re-run logic to populate ui with new record
  populateChart();
  populateTable();
  populateTotal();

  // also send to server
function response(){
    fetch("/api/transaction", {
    method: "POST",
    body: JSON.stringify(transaction),
    headers: {
      Accept: "application/json, text/plain, */*",
      "Content-Type": "application/json"
    }
  })
  .then(response => {    
    if(response.status == 200){
      console.log('success');
      return response.json();
    }else if(response.state == 404){
      console.log('error');
      return response.json();
    }
    else{
      console.log('error');
      return response.json();

    }
  })
  .then(data => {
    if (data.errors) {
      errorEl.textContent = "Missing Information333333333333";
      console.log('click data error---------------------');
    }
    else {
      // clear form
      nameEl.value = "";
      amountEl.value = "";
      console.log('click -success---------------------');

    }
  })
  .catch(err => {
    // fetch failed, so save in indexed db
    // clear form
    nameEl.value = "";
    amountEl.value = "";
    console.log('click catch error---------------------');

    // temp.unshift(transaction)
    // localStorage.setItem('localDb', JSON.stringify(temp));
    // tran2.unshift(transaction);    
    console.log(temp);
    console.log(tran2);
    saveRecord(transaction);

  });

}
  setTimeout(response, 2000);
  // response();

}

document.querySelector("#add-btn").onclick = function() {
  sendTransaction(true);
};

document.querySelector("#sub-btn").onclick = function() {
  sendTransaction(false);
};
