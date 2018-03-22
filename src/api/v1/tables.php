<?php
//get all/one order
$app->get('/products(/:id)', function ($id=null) use ($app) {
    //echoResponse(200, var_dump($id)); return;
    $response = array();
    $db = new DbHandler();
    if (!isAuthenticated()){
        echoResponse(403, "Not authenticated");
        return;
    }
    $q = "select * from products";
    if (isset($id)){
        $q .= " WHERE product_id=".$id;
    }
    $q .= " ORDER BY sort_order";
    $res = $db->getRecords($q);

    while ($row = $res->fetch_assoc()) {
        $row['product_id'] = (int)$row['product_id'];
        $row['sort_order'] = (int)$row['sort_order'];
        $row['width'] = (int)$row['width'];
        $response[] = $row;
    }
    echoResponse(200, $response);
});

$app->get('/cycles', function () use ($app) {
    //echoResponse(200, var_dump($id)); return;
    $response = array();
    $db = new DbHandler();
    if (!isAuthenticated()){
        echoResponse(403, "Not authenticated");
        return;
    }
    $q = "SELECT * from cycles ORDER BY sort_order";
    $res = $db->getRecords($q);

    while ($row = $res->fetch_assoc()) {        
        $row['cycle_id'] = (int)$row['cycle_id'];
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