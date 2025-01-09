const loginForm = document.getElementById('login-form');
const email = document.getElementById('login-email-or-username');
const password = document.getElementById('login-password');

loginForm.addEventListener('submit', e =>{
    e.preventDefault();
    // Prevent default so front end validation can be executed before submitting to server validation
    if(validateInputs()){
        loginForm.submit()
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
    const emailValue = email.value;
    const passwordValue = password.value;
    var valid = true;
    if (emailValue === ""){
        errorMessage(email,"Email is required");
        valid = false;
    }
    else{
        successMessage(email);
    }
    if (passwordValue === ""){
        errorMessage(password,'Password is required');
        valid = false;
    }
    else{
        successMessage(password);
    }
    if (valid){
        return true;
    }
    return false;
}