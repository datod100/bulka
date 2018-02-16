<?php
//get all/one order
$app->get('/statuses(/:id)', function ($id=null) use ($app) {
    //echoResponse(200, var_dump($id)); return;
    $response = array();
    $db = new DbHandler();
    if (!isAuthenticated()){
        echoResponse(403, "Not authenticated");
        return;
    }
    $q = "select * from statuses";
    if (isset($id)){
        $q .= " WHERE status_id=".$id;
    }
    $q .= " ORDER BY status_id";
    $res = $db->getRecords($q);

    while ($row = $res->fetch_assoc()) {
        $row['status_id'] = (int)$row['status_id'];
        $response[] = $row;
    }
    echoResponse(200, $response);
});

$app->get('/collection_history', function () use ($app) {
    //echoResponse(200, var_dump($id)); return;
    $response = array();
    $db = new DbHandler();
    if (!isAuthenticated()){
        echoResponse(403, "Not authenticated");
        return;
    }
    $q = "SELECT DISTINCT `collection` name, -1 id FROM `order_items_history` ORDER by `collection`";
    $res = $db->getRecords($q);

    while ($row = $res->fetch_assoc()) {        
        $row['id'] = (int)$row['id'];
        $response[] = $row;
    }
    echoResponse(200, $response);
});

//create order item
$app->post('/collection_history', function () use ($app) {
    $res = json_decode($app->request->getBody());
    //echoResponse(200,$res );return;
    $db = new DbHandler();
    if (!isAuthenticated()){
        echoResponse(403, "Not authenticated");
        return;
    }
    $q = sprintf("INSERT INTO order_items_history SET collection='%s', article='%s'",
        trim($res->collection), $res->article);
    $res = $db->execute($q);
    echoResponse(200, 'OK');
});