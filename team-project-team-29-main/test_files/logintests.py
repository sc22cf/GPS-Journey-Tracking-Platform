from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys

# The driver opens Chrome
driver = webdriver.Chrome()

# Creating the test cases to run
correct_users1 = ["Testuse663","663Testuse","Test663use"]
correct_users2 = ["testuser773","773testuser","test773user", "testuser883","883testuser","test883user"]
correct_pass = ["Computer78$","2Science!10","Password!!!20"]
incorrect_pass = ["t","compscience19!", " ", "CompScience19", "!","CompScience!!!"]

print("Correct password test:")

for i in range(len(correct_users1)):
    # Go to the registery page
    driver.get("http://127.0.0.1:5000/register")

    # Find the form elements
    username_input = driver.find_element(By.ID, "register-username")
    email_input = driver.find_element(By.ID, "register-email")
    password_input = driver.find_element(By.ID, "register-password")

    # Input the test case into the form elements
    username_input.send_keys(correct_users1[i])
    email_input.send_keys(correct_users1[i]+"@example.com")
    password_input.send_keys(correct_pass[i])

    # Submit the form 
    driver.find_element(By.NAME, "register").click()

    # Wait for the form to be submitted
    driver.implicitly_wait(100)

    # Check whether we end up on the right success page
    assert "http://127.0.0.1:5000/payment" in driver.current_url

    print(correct_pass[i]," Registration successful!")

print()
print("Incorrect password test:")

# Repeat for incorrect cases
for i in range(len(correct_users2)):
    # Go to the registery page
    driver.get("http://127.0.0.1:5000/register")

    # Find the form elements
    username_input = driver.find_element(By.ID, "register-username")
    email_input = driver.find_element(By.ID, "register-email")
    password_input = driver.find_element(By.ID, "register-password")

    # Input the test case into the form elements
    username_input.send_keys(correct_users2[i])
    email_input.send_keys(correct_users2[i]+"@example.com")
    password_input.send_keys(incorrect_pass[i])

    # Submit the form 
    driver.find_element(By.NAME, "register").click()

    # Wait for the form to be submitted
    driver.implicitly_wait(10)

    # Check whether we end up on the right success page
    assert "http://127.0.0.1:5000/register" in driver.current_url

    print(incorrect_pass[i]," Registration Failed!")

# Exit the driver
driver.quit()


