function editUser(userId) {
    // Enable form fields for editing
    var usernameInput = document.getElementById("username-" + userId);
    var membershipTypeInput = document.getElementById("membership_type-" + userId);

    var updateBut = document.getElementById('update-'+userId);
    var editBut = document.getElementById('edit-'+userId);
    updateBut.style.display = '';
    editBut.style.display = 'none';
    usernameInput.removeAttribute("readonly");
    membershipTypeInput.removeAttribute("disabled");

    usernameInput.classList.remove("readonly");
    membershipTypeInput.classList.remove("readonly");
}

function updateUser(userId) {

    var usernameInput = document.getElementById("username-" + userId);
    var membershipTypeInput = document.getElementById("membership_type-" + userId);

    $.ajax({
        url:"editUser",
        data:{id: userId,username:usernameInput.value, membership:membershipTypeInput.value},
        dataType:"json",

        success: function(data){
            // Update UI components with new data
            var weekly = document.getElementById('weekly-payments');
            var monthly = document.getElementById('monthly-payments');
            var yearly = document.getElementById('yearly-payments');
            weekly.textContent = data.weekly_members;
            monthly.textContent = data.monthly_members;
            yearly.textContent = data.yearly_members;
            myPieChart.data.datasets[0].data = [weekly.textContent, monthly.textContent, yearly.textContent];
            myPieChart.update();
        }
    });
    // Reset form fields to read-only
    var updateBut = document.getElementById('update-'+userId);
    var editBut = document.getElementById('edit-'+userId);
    updateBut.style.display = 'none';
    editBut.style.display = '';

    usernameInput.setAttribute("readonly", "readonly");
    membershipTypeInput.setAttribute("disabled", "disabled");

    usernameInput.classList.add("readonly");
    membershipTypeInput.classList.add("readonly");
}


graphPoints = []


function deleteUser(userId){
    $.ajax({
        url:"deleteUser",
        data:{id: userId},
        dataType:"json",

        success: function(data){
            var userRow = document.getElementById('row-'+userId);
            userRow.remove(); // Remove user row from the table
            // Update total counters and charts
            var users = document.getElementById('total-users');
            var routes = document.getElementById('total-routes');
            var weekly = document.getElementById('weekly-payments');
            var monthly = document.getElementById('monthly-payments');
            var yearly = document.getElementById('yearly-payments');
            users.textContent = data.total_users;
            routes.textContent = data.total_routes;
            weekly.textContent = data.weekly_members;
            monthly.textContent = data.monthly_members;
            yearly.textContent = data.yearly_members;
            myPieChart.data.datasets[0].data = [weekly.textContent, monthly.textContent, yearly.textContent];
            myPieChart.update();
        }
    });
}

function drawGraph(points) {
    var canvas = document.getElementById('myCanvas');
    var ctx = canvas.getContext('2d');
    // Calculate maximum value for y-axis scale
    var maxValue = Math.max(...points);

    var numBars = points.length;
    var totalSpacing = 10 * (numBars - 1); // Total spacing between bars
    var barWidth = (canvas.width - 100 - totalSpacing) / numBars; // Dynamic bar width

    var spacing = 10; // Spacing between bars
    // Clear previous graph
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.beginPath();
    ctx.moveTo(60, 40);
    ctx.lineTo(60, canvas.height - 40);
    ctx.stroke();
    ctx.font = "12px Arial";
    ctx.textAlign = "center";
    // Draw y-axis ticks and labels
    for (var i = 0; i <= maxValue; i += Math.ceil(maxValue/4)) {
        var y = canvas.height - 40 - (i * (canvas.height - 80) / maxValue);
        ctx.fillText(i.toString(), 43, y + 5);
    }
    ctx.fillText("Revenue (£)", 43, 20);

    ctx.beginPath();
    ctx.moveTo(60, canvas.height - 40);
    ctx.lineTo(canvas.width - 40, canvas.height - 40);
    ctx.stroke();
    ctx.textAlign = "center";
    // Draw x-axis labels
    for (var i = 0; i < numBars; i += Math.ceil(numBars/10)) {
        var x = 60 + i * (barWidth + spacing);
        ctx.fillText((i + 1).toString(), x + barWidth / 2, canvas.height - 25);
    }
    ctx.fillText("Week", canvas.width / 2, canvas.height - 7);
    // Draw bars for each point
    for (var i = 0; i < numBars; i++) {
        var x = 60 + i * (barWidth + spacing);
        var y = canvas.height - 40 - (points[i] * (canvas.height - 80) / maxValue);
        var barHeight = points[i] * (canvas.height - 80) / maxValue;

        ctx.fillStyle = 'blue';
        ctx.fillRect(x, y, barWidth, barHeight);
    }
}


let startOfWeek, endOfWeek;
const today = new Date();
const nearestMonday = new Date(today);
nearestMonday.setDate(today.getDate() - (today.getDay() + 6) % 7);
nearestMonday.setHours(0, 0, 0, 0);

const nearestSunday = new Date(today);
nearestSunday.setDate(today.getDate() + 365);
nearestSunday.setDate(nearestSunday.getDate() + (7 - nearestSunday.getDay()));

const fp = flatpickr("#weekPicker", {
    minDate: nearestMonday,
    maxDate: nearestSunday,
    mode: "range",
    dateFormat: "d/m/y",
    locale: {
        firstDayOfWeek: 1,
    },
    onChange: function(selectedDates, dateStr, instance) {
        if (selectedDates.length > 0 && selectedDates.length < 3) {
            if (selectedDates.length === 1) {
                const selectedDate = selectedDates[0];
                startOfWeek = new Date(selectedDate);
                startOfWeek.setDate(selectedDate.getDate() - (selectedDate.getDay() - 1));
                endOfWeek = null;
            } else if (selectedDates.length === 2) {
                const selectedDate = selectedDates[1];
                endOfWeek = new Date(selectedDate);
                endOfWeek.setDate(selectedDate.getDate() + (7 - selectedDate.getDay()));
                
                const firstSelectedDate = new Date(selectedDates[0]);
                startOfWeek = new Date(firstSelectedDate);
                startOfWeek.setDate(firstSelectedDate.getDate() - (firstSelectedDate.getDay() - 1));

                const differenceMs = endOfWeek.getTime() - startOfWeek.getTime();

                const weeks = Math.floor(differenceMs / (1000 * 60 * 60 * 24 * 7));
                
                updateGraph(
                    `${startOfWeek.getDate() < 10 ? '0' + startOfWeek.getDate() : startOfWeek.getDate()}/${(startOfWeek.getMonth() + 1) < 10 ? '0' + (startOfWeek.getMonth() + 1) : (startOfWeek.getMonth() + 1)}/${startOfWeek.getFullYear()}`,
                    `${endOfWeek.getDate() < 10 ? '0' + endOfWeek.getDate() : endOfWeek.getDate()}/${(endOfWeek.getMonth() + 1) < 10 ? '0' + (endOfWeek.getMonth() + 1) : (endOfWeek.getMonth() + 1)}/${endOfWeek.getFullYear()}`,
                    weeks + 1
                );
                
            }
            instance.setDate([startOfWeek, endOfWeek]);
        }
    }
});

window.onload = function(){
    const today1 = new Date();
    today1.setDate(today1.getDate() - (today1.getDay() - 1));
    const endDate = new Date(today1);
    endDate.setMonth(today1.getMonth() + 1);
    endDate.setDate(endDate.getDate() + (7 - endDate.getDay()));
    fp.setDate([today1, endDate]);

    // Call updateGraph with the initial selected dates
    updateGraph(
        `${today1.getDate() < 10 ? '0' + today1.getDate() : today1.getDate()}/${(today1.getMonth() + 1) < 10 ? '0' + (today1.getMonth() + 1) : (today1.getMonth() + 1)}/${today1.getFullYear()}`,
        `${endDate.getDate() < 10 ? '0' + endDate.getDate() : endDate.getDate()}/${(endDate.getMonth() + 1) < 10 ? '0' + (endDate.getMonth() + 1) : (endDate.getMonth() + 1)}/${endDate.getFullYear()}`,
        5 // Replace with the desired number of weeks
    );
}

function updateGraph(startOfWeek, endOfWeek, weeks) {

    graphPoints = []; // Initialize an empty array to store graph data points

    // Make an AJAX call to the server
    $.ajax({
        url: "updateGraph", // The URL to which the request is sent
        data: {start: startOfWeek, end: endOfWeek, weeks: weeks}, // Data sent to the server including the start and end dates, and the number of weeks
        dataType: "json", // The type of data expected back from the server

        success: function(data) {
            // This function is called if the server responds successfully

            // Loop through the weekly data received from the server and push each item to the graphPoints array
            data.weekly.forEach(function(item) {
                graphPoints.push(item);
            });
            // Call the drawGraph function to render the graph using the updated data points
            drawGraph(graphPoints);

            // Update the total revenue display on the webpage
            var revenue = document.getElementById('total_revenue');
            revenue.textContent = 'Total Revenue: £' + data.total.toFixed(2);
        }
    });
}

var weekly = document.getElementById('weekly-payments');
            var monthly = document.getElementById('monthly-payments');
            var yearly = document.getElementById('yearly-payments');

const data = {
    labels: ['Weekly', 'Monthly', 'Yearly'],
    datasets: [{
        label: 'Users',
        data: [weekly.textContent, monthly.textContent, yearly.textContent],
        backgroundColor: [
            'rgba(255, 99, 132, 0.5)',
            'rgba(54, 162, 235, 0.5)',
            'rgba(255, 206, 86, 0.5)',
        ],
        borderColor: [
            'rgba(255, 99, 132, 1)',
            'rgba(54, 162, 235, 1)',
            'rgba(255, 206, 86, 1)',
        ],
        borderWidth: 1
    }]
};

// Options for the pie chart
const options = {
    responsive: false,
    plugins: {
        legend: {
            position: 'top',
        },
        title: {
            display: true,
            text: 'Users per Membership'
        }
    },
    aspectRatio: 6,
};

// Get the canvas element
const ctx = document.getElementById('myPieChart').getContext('2d');

// Create the pie chart
const myPieChart = new Chart(ctx, {
    type: 'pie',
    data: data,
    options: options,
});