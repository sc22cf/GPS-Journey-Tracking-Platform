var map = L.map('map').setView([55.505, -5.09], 5);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

var colours = ['blue','red','green','orange', 'purple'];
colour_index = 0;

geos = []

// Add an event listener to the element with the ID 'gpxFileInput' for the 'change' event
document.getElementById('gpxFileInput').addEventListener('change', function(event) {
    // Retrieve the selected file
    var file = event.target.files[0];
    // Check if a file was selected
    if (!file) {
        return; // Exit the function if no file is selected
    }
    
    // Extract the file name without the file extension
    var fileName = file.name.substring(0, file.name.length - 4);
    
    // Create a new instance of FileReader
    var reader = new FileReader();
    
    // Define a function to be executed when the file is successfully loaded
    reader.onload = function(e) {
        // Retrieve the content of the file
        var gpxData = e.target.result;
        // Call the function 'parseGPXAndDisplay' with the file content and file name
        parseGPXAndDisplay(gpxData, fileName);
        // Reset the value of the file input element, clearing the selected file
        event.target.value = '';
    };
    
    // Read the contents of the file as text
    reader.readAsText(file);
});

// Function to parse GPX data and display
function parseGPXAndDisplay(gpxData, fileName) {
    // Create a new instance of DOMParser
    var parser = new DOMParser();
    // Parse the GPX data into an XML document
    var gpx = parser.parseFromString(gpxData, "text/xml");

    // Select all track points from the parsed GPX data
    var trackPoints = gpx.querySelectorAll('trkpt');
    // Initialize arrays to store latitude, longitude, timestamps, distance, and total time
    var latlngs = [];
    var coordinates = [];
    var timestamps = [];
    var distance = 0;
    var totalTime = 0;

    // Create a GeoJSON feature object
    var geojsonFeature = {
        "type": "Feature",
        "properties": {},
        "geometry": {
            "type": "LineString",
            "coordinates": []
        }
    };

    // Iterate over each track point
    trackPoints.forEach(function(point, index) {
        // Retrieve latitude and longitude from the track point
        var lat = parseFloat(point.getAttribute('lat'));
        var lon = parseFloat(point.getAttribute('lon'));
        // Push latitude and longitude into arrays
        latlngs.push([lat, lon]);
        // Create a Leaflet LatLng object
        var coord = L.latLng(lat, lon);
        // Push the LatLng object into coordinates array
        coordinates.push(coord);
        // Push coordinates into GeoJSON feature's geometry
        geojsonFeature.geometry.coordinates.push([lon, lat]);

        // Retrieve the time element from the track point
        var timeElement = point.querySelector('time');
        // Check if the time element exists
        if (timeElement) {
            // Extract the time string
            var timeString = timeElement.textContent;
        } else {
            // Display an error message if the time element is not found
            const fileFormatError = document.getElementById('file-format-error');
            fadeInElement(fileFormatError);
            setTimeout(() => {
                fadeOutElement(fileFormatError);
            }, 3000);
            console.error('The <time> element was not found.');
            return; // Exit the loop if time element is not found
        }

        // Create a Date object from the time string
        var time = new Date(timeString);
        // Push the timestamp into timestamps array
        timestamps.push(time);

        // Calculate distance and total time if there are previous coordinates
        if (index > 0) {
            var prevCoord = coordinates[index - 1];
            var prevTime = timestamps[index - 1];
            var segmentDistance = prevCoord.distanceTo(coord);
            var segmentTime = time - prevTime;
            distance += segmentDistance;
            totalTime += segmentTime;
        }
    });

    // Convert distance to kilometers
    var distanceKilometers = distance / 1000;
    // Convert total time to hours
    var totalHours = totalTime / (1000 * 60 * 60);

    // Calculate average speed in kilometers per hour
    var averageSpeed = distanceKilometers / totalHours;

    // Send GeoJSON data along with distance, total hours, average speed, and file name to server
    sendGeoDataToServer(geojsonFeature, distanceKilometers, totalHours, averageSpeed, fileName);
}

// Function to fade in an HTML element
function fadeInElement(element) {
    element.style.visibility = 'visible';
    element.style.opacity = 1;
}
// Function to fade out an HTML element
function fadeOutElement(element) {
    element.style.opacity = 0;
    setTimeout(() => {
        element.style.visibility = 'hidden';
    }, 500);
}

// Function to send GeoJSON data to the server
function sendGeoDataToServer(geojsonFeature, distanceKilometers, totalHours, averageSpeed, fileName) {
    // Send a POST request to the server with GeoJSON data and other parameters
    fetch('/receive_geojson', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        // Convert the data to JSON format and send it in the request body
        body: JSON.stringify({
            geoJSON: geojsonFeature,
            distance: distanceKilometers,
            time: totalHours,
            speed: averageSpeed,
            fileName: fileName
        }),
    })
    .then(response => response.json()) // Parse the JSON response
    .then(data => {
        // Extract the ID of the newly created item from the server response
        const newAccordionItemId = data.id; 
        // Create HTML for the new accordion item
        const accordionItemHtml = `
        <div class="accordion-item route-accordion-item display" id="accordion-${newAccordionItemId}">
            <button id="${newAccordionItemId}" draggable="false" ondragstart="drag(event)" onclick="zoomRoute('${newAccordionItemId}')" class="accordion-button collapsed" type="button" 
                data-bs-toggle="collapse" data-bs-target="#collapse${newAccordionItemId}"
                aria-expanded="false" aria-controls="collapse${newAccordionItemId}">
                <span class="span_class" style="width:100%; color:black;">${fileName}</span>
            </button>

            <div id="collapse${newAccordionItemId}" class="accordion-collapse collapse" data-bs-parent="#routeAccordion">
                <div class="accordion-body text-center">
                    <div>
                        <p><span class="fa fa-road" title="Route Distance"></span> ${data.distance} km</p>
                        <p><span class="fa-regular fa-clock" title="Time Taken"></span> ${data.time}</p>
                        <p><span class="fa-solid fa-person-running" title="Average Speed"></span> ${data.speed} km/h</p>
                    </div>
                    <div id="download-${newAccordionItemId}" class="btn btn-primary fa-solid fa-download" title="Download Route" onclick="downloadRoute('${newAccordionItemId}')"></div>
                    <div id="${newAccordionItemId}" class="btn btn-danger fa fa-trash-o" title="Delete Route" onclick="deleteRoute('${newAccordionItemId}')"></div>
                </div>
            </div>
        </div>
        `;

        // Get the accordion container element
        const accordionContainer = document.getElementById('routeAccordion');

        // Append the new item to the accordion
        accordionContainer.insertAdjacentHTML('afterbegin', accordionItemHtml);

        // Hide the 'No routes' message if it exists
        const noRouteMessage = document.getElementById('no-routes-message');
        if (noRouteMessage) {
            noRouteMessage.style.display = 'None';
        }

        // Get all accordion items
        const allAccordionItems = document.querySelectorAll('.route-accordion-item');
        var lastAccordion;
        var count = 0;
        // Find the last visible accordion item
        allAccordionItems.forEach((item) => {
            if (item.style.display != 'none') {
                lastAccordion = item;
                count++;
            }
        });
        // If there are more than 5 visible accordion items, remove the last one
        if (count > 5) {
            const lastAccordionId = lastAccordion.id.substring(10, lastAccordion.id.length);
            removeRoute(lastAccordionId);
            lastAccordion.style.display = 'none';
        }

        // Create a mock event object
        let mockEvent = {
            preventDefault: () => {}, // Mock preventDefault function
            dataTransfer: {
                getData: (key) => newAccordionItemId.toString() 
            }
        };

        // Call the drop function with the mock event
        drop(mockEvent);

    })
    .catch((error) => {
        console.error('Error:', error);
    });
}

// Function to download a route
function downloadRoute(id) {
    // Fetch GeoJSON data from the server
    fetch(`/retrieve_geojson/${id}`)
    .then(response => response.json()) // Parse the JSON response
    .then(data => {
        // Create a new JSZip instance
        var zip = new JSZip();
        
        // Add GeoJSON file to the ZIP
        var geoJsonData = JSON.stringify(data.geojson);
        zip.file(`${data.filename}.geojson`, geoJsonData);
        
        // Create content for the text file and add it to the ZIP
        var content = `Stats File for: ${data.filename}.gpx\n\nTotal Distance = ${data.distance} km\nAverage Speed = ${data.speed} km/h\nTime Taken = ${data.time}\nDate Uploaded = ${data.date}`;
        zip.file(`${data.filename}.txt`, content);
        
        // Generate the ZIP file and trigger the download
        zip.generateAsync({type: "blob"})
        .then(function(content) {
            var url = URL.createObjectURL(content);
            var a = document.createElement("a");
            a.href = url;
            a.download = `${data.filename}.zip`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        });
    })
    .catch((error) => {
        console.error('Error fetching GeoJSON data:', error);
    });
}

// Function to zoom to a route on the map
function zoomRoute(id) {
    // Find the index of the GeoJSON object with the specified ID
    var geoIndex = geos.findIndex(geoJSON => geoJSON.options.id === id);
    // Check if the GeoJSON object is found
    if (geoIndex !== -1) {
        // Fit the map bounds to the bounds of the GeoJSON object
        map.fitBounds(geos[geoIndex].getBounds());
    }
}

function allowDrop(ev) {
    ev.preventDefault();
}

// Function to handle drag events
function drag(ev) {
    if (ev.target.id.substring(0, 1) == 'f') {
        // If it is a friend ID
        ev.dataTransfer.setData("text", ev.target.id.substring(8, ev.target.id.length));
    } else {
        // Else it is a user ID
        ev.dataTransfer.setData("text", ev.target.id);
    }
}

function drop(ev) {
    // Prevent default behavior
    ev.preventDefault();
    // Get the route ID from the transferred data
    var routeId = ev.dataTransfer.getData("text");
    // Fetch GeoJSON data for the route from the server
    fetch('/retrieve_geojson/' + routeId)
    .then(response => response.json()) // Parse the JSON response
    .then(data => {
        // Check if there are already 5 routes displayed on the map
        if (geos.length == 5) {
            // Remove the first route from the map
            removeRoute(geos[0].options.id);
        }
        // Create a new GeoJSON layer from the fetched GeoJSON data
        var geojsonLayer = L.geoJSON(data.geojson, { id: routeId, color: colours[colours.length - 1] }).addTo(map);
        // Fit the map bounds to the bounds of the GeoJSON layer
        map.fitBounds(geojsonLayer.getBounds());
        // Add the GeoJSON layer to the 'geos' array
        geos.push(geojsonLayer);
        // Find the button element corresponding to the route ID
        var button = document.getElementById(routeId);
        if (!button) {
            button = document.getElementById('friends-' + routeId);
        }
        // Find the span element inside the accordion item
        var span = button.closest('.accordion-item').querySelector('span');
        // Set the color of the span to the last color in the 'colours' array
        span.style.color = colours[colours.length - 1];
        span.style.fontWeight = "bold";
        // Remove the last color from the 'colours' array
        colours.pop();
        // Ensure the user cannot drag on the same route
        button.draggable = false;
        var collapseElement = document.getElementById('collapse' + routeId);
        // Show the route data
        collapseElement.classList.add('show');
        button.setAttribute('aria-expanded', 'true');
        button.classList.remove('collapsed');
        var removeButton = document.createElement('button');
        removeButton.className = 'remove-button btn btn-warning fa fa-remove';
        removeButton.title = 'Remove Route From Map';
        removeButton.onclick = function() {
            removeRoute(routeId);
        };
        // Append the remove button to the accordion body
        collapseElement.querySelector('.accordion-body').appendChild(removeButton);
    })
    .catch(error => console.error('Error fetching GeoJSON:', error));
}



function removeRoute(routeId) {
    // Find the polyline corresponding to the routeName
    var geoIndex = geos.findIndex(geoJSON => geoJSON.options.id === routeId);
    if (geoIndex !== -1) {
        // Remove the polyline from the map
        map.removeLayer(geos[geoIndex]);
        // Remove the polyline from the array
        geos.splice(geoIndex, 1);
        var button = document.getElementById(routeId);
        if (!button){
            button = document.getElementById('friends-'+routeId);
        }
        var routeItem = button.closest('.accordion-item');
        var span = routeItem.querySelector('span');
        if (routeItem) {
            routeItem.querySelector('button').draggable = true;
            // After deleting, return the route colour to the colour queue
            colours.push(span.style.color);
            span.style.color = '';
            span.style.fontWeight = '';
            routeItem.style.display = '';
            var collapseElement = document.getElementById('collapse' + routeId);
            var remove_button = collapseElement.querySelector('.remove-button');
            remove_button.remove();
        }
    }
 }

function deleteRoute(id){
    routeId = parseInt(id);
    // Create AJAX request to delete the route stored in the database
    $.ajax({
        type:'GET',
        url: '/delete_route/'+routeId,
        success: function (){
            // Once the user clicks, delete the page will dynamically delete the route and remove from the screen
            removeRoute(id);
            document.getElementById('accordion-'+routeId).remove();
            const allAccordionItems = document.querySelectorAll('.route-accordion-item');
            let anyRouteExists = false;
            let displayedRouteExists = false;
            var firstHiddenAccordion;
            // Create a loop to see what accordion items need to be displayed in the place of the deleted route
            allAccordionItems.forEach((item) => {
                if (item){
                    anyRouteExists = true;
                    if (item.style.display != 'none'){
                        displayedRouteExists = true;
                    }
                }
                if (!firstHiddenAccordion && item.classList.contains('display') && item.style.display == "none"){
                    firstHiddenAccordion = item;
                }
            });
            var noRouteMessage = document.getElementById('no-routes-message');
            var errorMessage = document.getElementById('route-results');
            if (firstHiddenAccordion){
                firstHiddenAccordion.style.display = '';
            }
            else if (!anyRouteExists){
                noRouteMessage.style.display = '';
                errorMessage.innerText ='';
            }
            else if (!displayedRouteExists){
                errorMessage.innerText ='No routes found';
                noRouteMessage.style.display = 'none';
            }
            else{
                noRouteMessage.style.display = 'none';
                errorMessage.innerText ='';
            }
        }
    })

}

function liveDateSearch(){
    var accordionItems = document.querySelectorAll(".route-accordion-item");
    var selectedDate = document.getElementById("date").value;
    // Replace with filtered accordion items
    accordionItems.forEach(item =>{
        item.classList.remove('display');
    })
    // Create an AJAX request that searches the database and returns routes that match the date specified by the user
    $.ajax({
        url:"dateSearch",
        data:{date: selectedDate},
        dataType:"json",
        success: function(data){
            if (data.results) {
                // Create accordion items for all routes that have been found by date filter
                accordionItems = document.querySelectorAll(".route-accordion-item");
                $("#route-results").html('');
                var count = 0;
                data.results.forEach(function(route){
                    var accordionItem = document.getElementById('accordion-'+route.id);
                    accordionItem.classList.add('display');
                    if (count<5){
                        accordionItem.style.display = '';
                    }
                    count++;
                });
                var results1 = data.results;
                var resultIds = [results1.map(function(result) { return result.id; })];
                accordionItems.forEach(function(item) {
                    // Extracting the last part of the item ID
                    var itemIdPart = item.id.substring(10,item.id.length); // Adjusted to get the correct part of the ID
                    // Checking if this part is not in the resultIds array
                    if (!resultIds[0].includes(parseInt(itemIdPart))) {
                        // If it's not included in the results, hide the item
                        item.style.display = 'none';
                    }
                });
                
            }
            // If no routes are found for the specified date, display an error message to the user
            if (data.results.length == 0) {
                var errorMessage = document.getElementById('route-results');
                errorMessage.innerText ='No routes found';
                var noRouteMessage = document.getElementById('no-routes-message');
                noRouteMessage.style.display = "none";
            }
        }
    })
}

function liveRouteSearch(value){
    var accordionItems = document.querySelectorAll(".route-accordion-item");
    accordionItems.forEach(item =>{
        item.classList.remove('display');
    })
    // Create an AJAX request that searches the database and returns all routes that match a similar name to the user search
    $.ajax({
        url:"routeSearch",
        data:{searchText: value},
        dataType:"json",

        success: function(data){
            if (data.results) {
                // Create accordion Items for all routes that are returned by the search filter
                accordionItems = document.querySelectorAll(".route-accordion-item");
                $("#route-results").html('');
                var count = 0;
                data.results.forEach(function(route){
                    var accordionItem = document.getElementById('accordion-'+route.id);
                    if (accordionItem && accordionItem.classList.contains('display')) {
                        ;
                    }
                    else{
                        accordionItem.classList.add('display');
                        if (count<5){
                            accordionItem.style.display = '';
                        }
                    }
                    if (count >=5 ){
                        // Do not disply more than 5 routes at a time
                        accordionItem.classList.remove('display');
                        accordionItem.style.display = 'none';
                    }
                    count++;
                });
                var results1 = data.results;
                var resultIds = [results1.map(function(result) { return result.id; })];
                accordionItems.forEach(function(item) {
                    // Extracting the last part of the item ID
                    var itemIdPart = item.id.substring(10,item.id.length); // Adjusted to get the correct part of the ID
                    // Checking if this part is not in the resultIds array
                    if (!resultIds[0].includes(parseInt(itemIdPart))) {
                        // If it's not included in the results, hide the item
                        item.style.display = 'none';
                    }
                });
            }
            if (value != "" && data.results.length == 0){
                var errorMessage = document.getElementById('route-results');
                errorMessage.innerText ='No routes found';
                const noRouteMessage = document.getElementById('no-routes-message');
                noRouteMessage.style.display = 'none';
            }
            else if (data.results.length == 0) {
                var errorMessage = document.getElementById('route-results');
                errorMessage.innerText ='';
                const noRouteMessage = document.getElementById('no-routes-message');
                noRouteMessage.style.display = '';
            }
        }
    })
}

function liveFriendSearch(value){
    value = value.trim();
    var current_results = document.querySelectorAll(".friend-item");
    const searchHeader = document.getElementById("results1").previousElementSibling;
    current_results.forEach(function(result){
        result.style.display = 'none';
        result.classList.remove('display');
    })
    if(value != ""){
        // Create an AJAX request to search for users friends
        $.ajax({
            url:"friendSearch",
            data:{searchText: value},
            dataType:"json",

            success: function(data){
                searchHeader.innerText = "Friends Found...";
                var count = 0;
                // Display 5 of the user's friends that are most similar to the search criteria
                data.results.forEach(function(user){
                    var userItem = document.getElementById("friend-item-"+user.id);
                    userItem.classList.add('display');
                    if (count < 5){
                        userItem.style.display = ""; 
                        
                    }  
                    count++;
                });
                // If the user has no friends that meet the search criteria, display an error
                if (data.results.length == 0){
                    $("#result1-error").html('<div class="p-1 text-center"> No friends found </div>'); 
                }
                else{
                    $("#result1-error").html('');
                }
                
            }
        })
    }else{
        // Display the users 5 most recent friends if the search bar is blank
        searchHeader.innerText = "Following";
        var count = 0;
        current_results.forEach(function(result){
            if (count < 5){
                result.style.display = '';
            }
            result.classList.add('display');
            count++;
        });
        $("#result1-error").html('');
    }
}


function liveUserSearch(value){
    value = value.trim();
    var current_results = document.querySelectorAll(".user-items");
    const searchHeader = document.getElementById("results").childNodes[1];
    current_results.forEach(function(result){
        result.style.display = 'none';
    })
    if(value != ""){
        // Create an AJAX request to display 5 users that are most similar to the user's search 
        $.ajax({
            url:"userSearch",
            data:{searchText: value},
            dataType:"json",

            success: function(data){
                // Display the 5 found users in the database, that meet the search criteria
                searchHeader.innerText = "Found Results...";
                var count = 0;
                data.results.forEach(function(user){
                    if (count < 5){
                       var userItem = document.getElementById("user-item-"+user.id);
                        userItem.style.display = ""; 
                    }  
                    count++;
                });
                // If users are found
                if (data.results.length == 0){
                    $("#result-error").html('<div class="p-1 text-center"> No users found </div>'); 
                }
                else{
                    $("#result-error").html('');
                }
                
            }
        })
    }else{
        // If the user decides to clear the search, display the top followed users again
        searchHeader.innerText = "Top Followed";
        var count = 0;
        current_results.forEach(function(result){
            if (count < 5){
                result.style.display = '';
            }
            count++;
        });
        $("#result-error").html('');
    }
}

function displayFriendRoutes(userId,followClicked){
    if (!followClicked){
        const exploreFriendsTab = document.getElementById('explore-friends-tab');
        const friendRoutesTab = document.getElementById('friends-routes-tab');
        friendRoutesTab.ariaHidden = 'true';
        friendRoutesTab.classList.remove('active');
        exploreFriendsTab.ariaHidden = 'false';
        exploreFriendsTab.classList.add('active');
    
        const friendsRoutesContent = document.getElementById('friends-routes');
        const exploreFriendsContent = document.getElementById('explore-friends');
        friendsRoutesContent.classList.remove('active','show');
        exploreFriendsContent.classList.add('active','show');
    
        const accordionItems = document.querySelectorAll('.friend-accordion-item')
        accordionItems.forEach(function(item){
            item.style.display = 'none';
        })
        const backButton = document.getElementById('back-explore');
        backButton.style.display = '';
    }
    $.ajax({
        url: "/displayFriendRoutes",
        data: { userId: userId },
        dataType:"json",
        success: function(data) {
            notHidden = [];
            data.results.forEach((result) => {
                var selectedFriend = document.getElementById('friend-accordion-'+result.id);
                if (selectedFriend){
                    selectedFriend.style.display = '';
                }
                else{
                    notHidden.push(result)
                }
            })
            notHidden.forEach(function(item){
                const friendAccordion = `<div class="accordion-item friend-accordion-item  display" id="friend-accordion-${item.id}">
                <button id="friends-${item.id}" draggable="true" ondragstart="drag(event)" onclick="zoomRoute('${item.id}')" class="accordion-button collapsed" type="button" 
                    data-bs-toggle="collapse" data-bs-target="#collapse${item.id}"
                    aria-expanded="false" aria-controls="collapse${item.id}">
                    <span class="span_class" style="width:100%; color:black;">${item.fileName}, ${item.username}</span>
                    
                </button>

                <div id="collapse${item.id}" class="accordion-collapse collapse" data-bs-parent="#friendAccordion">
                    <div class="accordion-body text-center">
                        <div>
                            <p><span class="fa fa-road" title="Route Distance"></span>  ${item.distance} km</p>
                            <p><span class="fa-regular fa-clock" title="Time Taken"></span>  ${item.time}</p>
                            <p><span class="fa-solid fa-person-running" title="Average Speed"></span>  ${item.speed} km/h</p>
                        </div>
                    </div>
                </div>
            </div>`;

            if (data.results.length > 0){
                const no_friends = document.getElementById('no-friends-routes-message');
                no_friends.style.display = 'none';
            }

            const accordionContainer = document.getElementById('friendAccordion');
    
            // Append the new item to the accordion
            accordionContainer.insertAdjacentHTML('afterbegin', friendAccordion);

            })
        }
    });
}

function displayRecentRoutes(){
    const backButton = document.getElementById('back-explore');
    backButton.style.display = 'none';
    const accordionItems = document.querySelectorAll('.friend-accordion-item')
    accordionItems.forEach(function(item){
        item.style.display = 'none';
    })

    $.ajax({
        // If the friends, map icon is pressed create an AJAX request to show all their most recent routes
        url: "/displayRecentRoutes",
        dataType:"json",
        success: function(data) {
            data.results.forEach((result) => {
                var selectedFriend = document.getElementById('friend-accordion-'+result.id);
                if (selectedFriend){
                    selectedFriend.style.display = '';
                }
            })
        }
    });
}


function togglefollowUser(userId) {
    const userButton = document.getElementById('icon-button-'+ userId);
    const userAccount = document.getElementById('user-followers-'+ userId);
    if (userButton.classList.contains('follow')){
        // Create an AJAX request to follow the user dynamically, so that you can see their followers increase and see their most recent routes
        $.ajax({
            url: "/follow_user",
            method: "POST",
            data: { userId: userId },
            success: function(data) {

                // Change button icon
                userButton.classList.add('followed');
                userButton.classList.remove('follow');
                const icon = userButton.childNodes[0];
                icon.classList.remove('fa-circle-plus');
                icon.classList.add('fa-circle-check');
                icon.title = 'Remove Friend'
                // Append friend button to list
                
                const friendButton = `<div class="friend-item display" id="friend-item-${userId}">
                                        <div class="p-3 mb-3 d-flex border rounded shadow-sm justify-content-between" id="friend-${userId}">
                                        ${ data.username }
                                        <div class="d-flex justify-content-end">
                                            <button class="icon-button friend-route mx-1" id="friend-button-${userId}" onclick="displayFriendRoutes('${userId}',false)"><i class="fa-solid fa-map-location-dot fa-xl" title="View Friend's Routes"></i></button>
                                            <button class="icon-button unfollow" id="friend-button-${userId}" onclick="togglefollowUser('${userId}')"><i class="fa-regular fa-circle-xmark fa-xl" title='Remove Friend'></i></button>
                                        </div>
                                        </div>`;
                const friendListContainer = document.getElementById('results1');
                userAccount.innerText = parseInt(userAccount.innerText) + 1;
                // Append the new item to the accordion
                friendListContainer.insertAdjacentHTML('afterbegin', friendButton);

                const allFriendItems = document.querySelectorAll('.friend-item');
                var lastFriendItem;
                var count = 0;
                allFriendItems.forEach((item) => {
                    if (item.style.display != 'none'){
                        lastFriendItem = item;
                        count++;
                    }
                });
                if (count >5){
                    lastFriendItem.style.display = 'none';
                }
                // 
                displayFriendRoutes(userId,true);
                displayRecentRoutes();
            },
            error: function() {
                alert("Error following the user.");
            }
        });
        }
    else{
        $.ajax({
            // Create an AJAX request that deletes the friend-user relationship in the database 
            // and deletes their routes from the friend page
            url: "/unfollow_user",
            method: "POST",
            data: { userId: userId },
            success: function(data) {
                // Change button icon if unfollowed in add friend tab
                if (userButton){
                    userButton.classList.add('follow');
                    userButton.classList.remove('followed');
                    const icon = userButton.childNodes[0];
                    icon.classList.remove('fa-circle-check');
                    icon.classList.add('fa-circle-plus');
                    icon.title = 'Add Friend';
                }
                // Remove friend from list
                const friend = document.getElementById('friend-item-'+ userId);
                friend.remove();

                userAccount.innerText = parseInt(userAccount.innerText) - 1;
                // Remove all route accordions with the corresponding friend-accordion ID
                data.results.forEach(result => {
                    removeRoute(result.id.toString());
                    var friendAccordion = document.getElementById('friend-accordion-' + result.id);
                    friendAccordion.remove();
                })

                const allFriendItems = document.querySelectorAll('.friend-item');
                let anyFriendExists = false;
                let displayedFriendExists = false;
                var firstHiddenFriend;
                // Now the friend routes have been deleted, other friend routes can be displayed in its place
                // If other friend routes exist, unhide these until 5 route accordions are displayed
                allFriendItems.forEach((item) => {
                    if (item){
                        anyFriendExists = true;
                        if (item.style.display != 'none'){
                            displayedFriendExists = true;
                        }
                    }
                    if (!firstHiddenFriend && item.classList.contains('display') && item.style.display == "none"){
                        firstHiddenFriend = item;
                    }
                });

                if (firstHiddenFriend){
                    firstHiddenFriend.style.display = '';
                }

                const all_friend_routes = document.querySelectorAll('.friend-accordion-item');

                if (all_friend_routes.length == 0){
                    const no_friends = document.getElementById('no-friends-routes-message');
                    no_friends.style.display = '';
                }
            },
            error: function() {
                alert("Error following the user.");
            }
        });
    }
    }

// Clear the map
function clearMap(){
    while (geos.length > 0){
        removeRoute(geos[0].options.id);
    }
}