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
    require_once 'passwordHash.php';
    $db = new DbHandler();
    $password = $r->password;
    $email = $r->username;
    $isUserExists = $db->getOneRecord("select 1 from customers_auth where email='$email'");
    if (!$isUserExists) {
        $r->password = passwordHash::hash($password);
        
        $q ="INSERT INTO `customers_auth`(`first_name`, `last_name`, `email`, `password`) VALUES (?,?,?,?)";
        $stmt = $db->conn->stmt_init();
        $stmt->prepare($q);
        $stmt->bind_param("ssss",$r->firstName,$r->lastName,$r->username, $r->password);
        $stmt->execute();
        $uid = $stmt->insert_id;

        if ($uid != 0) {
            $response = "User account created successfully";
            if (!isset($_SESSION)) {
                session_start();
            }
            echoResponse(200, $response);
        } else {
            $response = "Failed to create customer. Please try again";
            echoResponse(201, $response);
        }
    } else {
        $response = "An user with the provided phone or email exists!";
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