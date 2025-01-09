const registerForm = document.getElementById('register-form');
const username = document.getElementById('register-username')
const email = document.getElementById('register-email');
const password = document.getElementById('register-password');

registerForm.addEventListener('submit', e =>{
    e.preventDefault();
    if(validateInputs()){
        registerForm.submit()
    }
    else {
        e.preventDefault();
    }
})

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

function validateInputs(){
    const emailValue = email.value.trim();
    const passwordValue = password.value.trim();
    const usernameValue = username.value.trim();
    const passwordRegEx = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[^a-zA-Z0-9])(?!.*\s).{8,16}$/;
    const  emailRegEx = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
    var valid = true;
    if (usernameValue === ""){
        errorMessage(username,"Username is required");
        valid = false;
    } else if ( usernameValue.length < 6 || usernameValue.length > 25){
        errorMessage(username,"Username must be between 6 and 25 characters")
        valid = false;
    }
    
    else{
        successMessage(username);
    }
    //email validation
    if (emailValue === ""){
        errorMessage(email,"Email is required");
        valid = false;
    }
    else if (!(emailRegEx.test(emailValue))) {
        errorMessage(email,"Email provided is not valid");
        valid = false;
    }
    else{
        successMessage(email);
    }
    if (passwordValue === ""){
        errorMessage(password,'Password is required');
        valid = false;
    }
    else if (!(passwordRegEx.test(passwordValue))){
        errorMessage(password,"Must be between 8 and 16 characters long, with uppercase, lowercase, special character and number");
        valid = false;
    }
    else{
        successMessage(password);
    }
    if (valid){
        return true;
    }
    return false;
};

