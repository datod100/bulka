<?php
//get all/one client
$app->get('/clients(/:client_id)', function ($client_id=null) use ($app) {
    //echoResponse(200, var_dump($client_id)); return;
    $response = array();
    $db = new DbHandler();
    if (!isAuthenticated()){
        echoResponse(403, "Not authenticated");
        return;
    }
    $q = "select * from clients";
    if (isset($client_id)){
        $q .= " WHERE client_id=".$client_id;
    }
    $q .= " ORDER BY name";
    $res = $db->getRecords($q);

    while ($row = $res->fetch_assoc()) {
        $row['client_id'] = (int)$row['client_id'];
        $response[] = $row;
    }
    echoResponse(200, $response);
});

//delete client
$app->delete('/clients/:client_id', function ($client_id) {
    $response = array();
    $db = new DbHandler();
    if (!isAuthenticated()){
        echoResponse(403, "Not authenticated");
        return;
    }
    $q = "delete from clients where client_id=".$client_id;
    $res = $db->execute($q);
    echoResponse(200, 'OK');
});

//update client
$app->put('/clients', function () use ($app) {
    $res = json_decode($app->request->getBody());
    $response = array();
    $db = new DbHandler();
    if (!isAuthenticated()){
        echoResponse(403, "Not authenticated");
        return;
    }
    $q = "UPDATE clients SET name='".trim($res->name)."' WHERE client_id=".$res->client_id;
    $res = $db->execute($q);
    echoResponse(200, 'OK');
});

//create client
$app->post('/clients', function () use ($app) {
    
    //echoResponse(200, );return;
    $res = json_decode($app->request->getBody());
    $db = new DbHandler();
    if (!isAuthenticated()){
        echoResponse(403, "Not authenticated");
        return;
    }
    $q = "INSERT INTO clients SET name='".trim($res->name)."'";
    $res = $db->execute($q);
    echoResponse(200, 'OK');
});