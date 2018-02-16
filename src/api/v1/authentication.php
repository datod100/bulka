<?php
use \Firebase\JWT\JWT;

$app->post('/session', function () use ($app) {
    
    $r = json_decode($app->request->getBody());
    $db = new DbHandler();
    $session = $db->getSession();

    if ($session["token"] == $r->token){        
        $response["uid"] = $session['uid'];
        $response["email"] = $session['email'];
        $response["firstName"] = $session['firstName'];
        $response['lastName'] = $session['lastName'];
    }else{
        echoResponse(403, "Not authenticated");
        return;
    }
    echoResponse(200, $session);
});

$app->post('/login', function () use ($app) {
    require_once 'passwordHash.php';
    $r = json_decode($app->request->getBody());
    //print_r($r);;exit;
    //verifyRequiredParams(array('email', 'password'),$r->customer);
    $response = array();
    $db = new DbHandler();
    $password = $r->password; //$r->customer->password;
    $email = $r->email; //$r->customer->email;
    $user = $db->getOneRecord("select * from customers_auth where email='$email'");
    if ($user != null) {
        if (passwordHash::check_password($user['password'], $password)) {
            $response['firstName'] = $user['first_name'];
            $response['lastName'] = $user['last_name'];
            $response['uid'] = $user['uid'];
            $response['email'] = $user['email'];
            //$response['createdAt'] = $user['created'];

            $key = "wftoken";
            $token = array(
                "iat" => 1356999524,
                "nbf" => 1357000000
            );

            $response['token'] = JWT::encode($token, $key);
            if (!isset($_SESSION)) {
                session_start();
            }
            $_SESSION['uid'] = $user['uid'];
            $_SESSION['email'] = $email;
            $_SESSION['firstName'] = $user['first_name'];
            $_SESSION['lastName'] = $user['last_name'];
            $_SESSION['token'] = $response['token'];
            echoResponse(200, $response);
        } else {
            echoResponse(400, 'Username or password is incorrect');
        }
    } else {
        echoResponse(400, 'No such user is registered');
    }
});
$app->post('/signUp', function () use ($app) {
    $response = array();
    $r = json_decode($app->request->getBody());
    verifyRequiredParams(array('email', 'name', 'password'), $r->customer);
    require_once 'passwordHash.php';
    $db = new DbHandler();
    $phone = $r->customer->phone;
    $name = $r->customer->name;
    $email = $r->customer->email;
    $address = $r->customer->address;
    $password = $r->customer->password;
    $isUserExists = $db->getOneRecord("select 1 from customers_auth where phone='$phone' or email='$email'");
    if (!$isUserExists) {
        $r->customer->password = passwordHash::hash($password);
        $tabble_name = "customers_auth";
        $column_names = array('phone', 'name', 'email', 'password', 'city', 'address');
        $result = $db->insertIntoTable($r->customer, $column_names, $tabble_name);
        if ($result != null) {
            $response["status"] = "success";
            $response["message"] = "User account created successfully";
            $response["uid"] = $result;
            if (!isset($_SESSION)) {
                session_start();
            }
            $_SESSION['uid'] = $response["uid"];
            $_SESSION['phone'] = $phone;
            $_SESSION['name'] = $name;
            $_SESSION['email'] = $email;
            echoResponse(200, $response);
        } else {
            $response["status"] = "error";
            $response["message"] = "Failed to create customer. Please try again";
            echoResponse(201, $response);
        }
    } else {
        $response["status"] = "error";
        $response["message"] = "An user with the provided phone or email exists!";
        echoResponse(201, $response);
    }
});
$app->get('/logout', function () {
    $db = new DbHandler();
    $session = $db->destroySession();
    $response["status"] = "info";
    $response["message"] = "Logged out successfully";
    echoResponse(200, $response);
});

function isAuthenticated(){
    $db = new DbHandler();
    if ($db->getSession()["uid"]==''){
        return false;
    }
    return true;
}