from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException

# The driver opens Chrome
driver = webdriver.Chrome()

# Registers a new user to allow for payment
driver.get("http://127.0.0.1:5000/register")
username_input = driver.find_element(By.ID, "register-username")
email_input = driver.find_element(By.ID, "register-email")
password_input = driver.find_element(By.ID, "register-password")

username_input.send_keys("913keith")
email_input.send_keys("913keith@example.com")
password_input.send_keys("Keith203!")

driver.find_element(By.NAME, "register").click()

# Pause the system until the payment page is reached
WebDriverWait(driver, 10).until(EC.url_contains("payment"))

# The test data for the test cases (card number, expiry date, cvc, zip code)
correct_payment = [["4242424242424242","0234","123","42424"],["4000056655665556","0234","123","42424"],["378282246310005","0234","1234","42424"]]
incorrect_payment = [["4242424","0234","123","42424"],["4000056655665556","0212","123","42424"],["378282246310005","0234","1","42424"],["4242424242424242","0234","123","0"]]


print("Correct payment test:")
print()

for i in range(len(correct_payment)):
    driver.get("http://127.0.0.1:5000/payment")

    # Find the membership plans form
    radio_options = driver.find_elements(By.CSS_SELECTOR, "[name='plan']")

    # Choose the radio option you want to click
    option_to_click = radio_options[1]

    # Click on the chosen radio option
    option_to_click.click()

    # Find the card info frame
    iframe = WebDriverWait(driver, 10).until(EC.presence_of_element_located((By.CSS_SELECTOR, "iframe[name^='__privateStripeFrame']")))
    driver.switch_to.frame(iframe)

    # Find and input into the card elements
    card_input = WebDriverWait(driver, 10).until(EC.element_to_be_clickable((By.CSS_SELECTOR, "input[name='cardnumber']")))
    card_input.send_keys(correct_payment[i][0])

    expiration_input = WebDriverWait(driver, 10).until(EC.element_to_be_clickable((By.CSS_SELECTOR, "input[name='exp-date']")))
    expiration_input.send_keys(correct_payment[i][1])

    cvc_input = WebDriverWait(driver, 10).until(EC.element_to_be_clickable((By.CSS_SELECTOR, "input[name='cvc']")))
    cvc_input.send_keys(correct_payment[i][2])

    # Handle the zip code input field if it exists
    zip_input = driver.find_element(By.CSS_SELECTOR, "input[name='postal']")
    if zip_input:
        zip_input.send_keys(correct_payment[i][3])

    # Switch back to the default content
    driver.switch_to.default_content()

    # Submit the form 
    driver.find_element(By.NAME, "continue").click()

    # If the payments info reaches the home page it was successful, if not then it failed
    try:
        WebDriverWait(driver, 10).until(EC.url_contains("home"))
        print("Payment Successful")
    except TimeoutException:
        print("Payment Failed")
    print(correct_payment[i][0], correct_payment[i][1], correct_payment[i][2], correct_payment[i][3])
    print()

print()
print("Incorrect payment test:")
print()

# Do the same for the incorrect data
for i in range(len(incorrect_payment)):
    driver.get("http://127.0.0.1:5000/payment")
    radio_options = driver.find_elements(By.CSS_SELECTOR, "[name='plan']")

    option_to_click = radio_options[1]

    option_to_click.click()

    iframe = WebDriverWait(driver, 10).until(EC.presence_of_element_located((By.CSS_SELECTOR, "iframe[name^='__privateStripeFrame']")))
    driver.switch_to.frame(iframe)

    card_input = WebDriverWait(driver, 10).until(EC.element_to_be_clickable((By.CSS_SELECTOR, "input[name='cardnumber']")))
    card_input.send_keys(incorrect_payment[i][0])

    expiration_input = WebDriverWait(driver, 10).until(EC.element_to_be_clickable((By.CSS_SELECTOR, "input[name='exp-date']")))
    expiration_input.send_keys(incorrect_payment[i][1])

    cvc_input = WebDriverWait(driver, 10).until(EC.element_to_be_clickable((By.CSS_SELECTOR, "input[name='cvc']")))
    cvc_input.send_keys(incorrect_payment[i][2])

    zip_input = driver.find_element(By.CSS_SELECTOR, "input[name='postal']")
    if zip_input:
        zip_input.send_keys(incorrect_payment[i][3])

    driver.switch_to.default_content()

    driver.find_element(By.NAME, "continue").click()

    try:
        WebDriverWait(driver, 10).until(EC.url_contains("home"))
        print("Payment Successful")
    except TimeoutException:
        print("Payment Failed")
    print(incorrect_payment[i][0], incorrect_payment[i][1], incorrect_payment[i][2], incorrect_payment[i][3])
    print()

# Exit the driver
driver.quit()