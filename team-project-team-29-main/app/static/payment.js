
var stripe = Stripe('pk_test_51OlvRTGtS0Bq4hChWMLpUuqo4T4P6ZJ6un0xylcwfAevX5a5G0h55EbrXeu9v1K84IqCBxz4RoiS2I1lVexeJLJl009XaA6c1B');
var elements = stripe.elements();
var card = elements.create('card');

var cardDetails = document.getElementById('card-element');
card.mount('#card-element');


var form = document.getElementById('payment-form');

form.addEventListener('submit', function(event) {
  var cardElement = document.getElementById('card-element');
  var cardElementValue = cardElement.value;
  event.preventDefault();
    // Prevent the default submission so the stripe API can validate if the card details are valid
    // Create a stripe token that can be used to charge the card again and validate all other inpot fields before confirming payment
    stripe.createToken(card).then(function(result) {
      if (result.error) {
        validateFormInputs();
        // Inform the user if there was an error
        cardDetails.classList.add('error');
        cardDetails.classList.remove('success');
      } else {
        // success display
        cardDetails.classList.add('success');
        cardDetails.classList.remove('error');
        if(validateFormInputs()){

        // Send the token to flask server
        var token = result.token;
        var last4 = token.card.last4;
        var expMonth = token.card.exp_month;
        var expYear = token.card.exp_year;
        var formattedMonth = ('0' + expMonth).slice(-2);

        // Get the last two digits of expYear
        var formattedYear = expYear.toString().slice(-2);

        // Concatenate formattedMonth and formattedYear with a '/' separator
        var formattedExpiration = formattedMonth + '/' + formattedYear;
        // Send the token to your server using an AJAX request
        var xhr = new XMLHttpRequest();
        xhr.open('POST', '/payment');
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.onload = function() {
          if (xhr.status === 200) {
            // Redirect to the success page
            window.location.href = '/home';  
          } else {
            // Handle error response from the server
            console.error('Server error:', xhr.responseText);
          }
        };
        xhr.send(JSON.stringify({token: token.id,   plan: document.querySelector('input[name="plan"]:checked').value, 
        street_address: document.getElementById('street-address').value, city: document.getElementById('city').value,
        country: document.getElementById('country').value, postcode: document.getElementById('postcode').value,
        last_4_digits: last4, expiration_date:formattedExpiration
      }));
        }
        
      }
    }); 
});

const street_address = document.getElementById('street-address')
const city = document.getElementById('city')
const country = document.getElementById('country')
const postcode = document.getElementById('postcode')

function errorMessage(element, message){
    // Display an error message to inform the user on incorrect form fields
    let inputControl = element.parentElement;
    let errorDisplay = inputControl.querySelector(".error");
    errorDisplay.innerText = message;
    inputControl.classList.add('error');
    inputControl.classList.remove('success');
};

function successMessage(element){
  // Remove any error messages, and change the field box to green to show success
  let inputControl = element.parentElement;
    let errorDisplay = inputControl.querySelector('.error');
    errorDisplay.innerText = "";
    inputControl.classList.add('success');
    inputControl.classList.remove('error');
};

function validateFormInputs(){
    const streetValue = street_address.value.trim();
    const cityValue = city.value.trim();
    const countryValue = country.value;
    const postcodeValue = postcode.value.trim();
    const postcodeRegEx = /[A-Z]{1,2}[0-9]{1,2} ?[0-9][A-Z]{2}/i; 

    var valid = true;
    if (streetValue === ""){
        errorMessage(street_address,"Street address is required");
        valid = false;
    }
    else{
        successMessage(street_address);
    }
    if (cityValue === ""){
        errorMessage(city,'City is required');
        valid = false;
    }
    else{
        successMessage(city);
    }
    if (postcodeValue === ""){
      errorMessage(postcode,'Postcode is required');
      valid = false;
    } else if (!(postcodeRegEx.test(postcodeValue)) && countryValue == "United Kingdom"){
      errorMessage(postcode,"Invalid UK postcode");
      valid = false;
    }
    else{
        successMessage(postcode);
    }
    successMessage(country);
    if (valid){
        return true;
    }
    return false;
}