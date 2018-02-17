<?php
//get all/one client
$app->get('/clients(/:client_id)', function ($client_id=null) use ($app) {
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
        $row['hetpei'] = (int)$row['hetpei'];
        $row['group_id'] = (int)$row['group_id'];
        $response[] = $row;
    }
    //echoResponse(200, var_dump($response)); return;
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
    $q = "UPDATE clients SET
        name=?,
        hetpei=?,
        address=?,
        email=?,
        phone=?,
        contact_person=?,
        travel_duration=?,
        group_id=?,
        default_time1=?,
        default_time2=?,
        default_time3=?
        WHERE client_id=?";

    $stmt = $db->conn->stmt_init();
    $stmt->prepare($q);
    $stmt->bind_param('sdsssssdsssd',
        $res->name,
        $res->hetpei,
        $res->address,
        $res->email,
        $res->phone,
        $res->contact_person,
        $res->travel_duration,
        $res->group_id,
        $res->default_time1,
        $res->default_time2,
        $res->default_time3,
        $res->client_id
    );
    $stmt->execute();
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

    $q = "INSERT INTO clients SET
        name=?,
        hetpei=?,
        address=?,
        email=?,
        phone=?,
        contact_person=?,
        travel_duration=?,
        group_id=?,
        default_time1=?,
        default_time2=?,
        default_time3=?";

    $stmt = $db->conn->stmt_init();
    $stmt->prepare($q);
    $stmt->bind_param('sdsssssdsss',
        $res->name,
        $res->hetpei,
        $res->address,
        $res->email,
        $res->phone,
        $res->contact_person,
        $res->travel_duration,
        $res->group_id,
        $res->default_time1,
        $res->default_time2,
        $res->default_time3
    );
    //echoResponse(200, var_dump($stmt)); return;
    $result = $stmt->execute();
    if ( false===$result ) {
        echoResponse(500, $stmt->error); return;
    }
    $response = $stmt->insert_id;
    echoResponse(200, $response);
});