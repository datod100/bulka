<?php

//get all/one order
$app->get('/order_items/:id', function ($id) use ($app) {
    //echoResponse(200, var_dump($id)); return;
    $response = array();
    $db = new DbHandler();
    if (!isAuthenticated()){
        echoResponse(403, "Not authenticated");
        return;
    }
    $q = "select * from order_items WHERE order_id=".$id." ORDER BY collection_name DESC";
    $res = $db->getRecords($q);

    while ($row = $res->fetch_assoc()) {
        $row["order_item_id"] = (int)$row["order_item_id"];
        $row["order_id"] = (int)$row["order_id"];
        $row["quantity"] = (int)$row["quantity"];
        $row["price"] = (float)$row["price"];
        $response[] = $row;
    }
    echoResponse(200, $response);
});

//update order item
$app->put('/order_items', function () use ($app) {
    $res = json_decode($app->request->getBody());
    $response = array();
    $db = new DbHandler();
    if (!isAuthenticated()){
        echoResponse(403, "Not authenticated");
        return;
    }
    
    $q = sprintf("UPDATE order_items SET collection_name='%s', article='%s', quantity=%d, product_type='%s', price=%f WHERE order_item_id=%d",
        trim($res->collection_name), $res->article, $res->quantity, $res->product_type, $res->price, $res->order_item_id);
    
    $res = $db->execute($q);
    echoResponse(200, 'OK');
});

//create order item
$app->post('/order_items', function () use ($app) {
    $res = json_decode($app->request->getBody());
    //echoResponse(200,$res );return;
    $db = new DbHandler();
    if (!isAuthenticated()){
        echoResponse(403, "Not authenticated");
        return;
    }
    $q = sprintf("INSERT INTO order_items SET collection_name='%s', article='%s', quantity=%d, product_type='%s', price=%f,  order_id=%d",
        trim($res->collection_name), $res->article, $res->quantity, strtolower($res->product_type), $res->price, $res->order_id);
    $res = $db->execute($q);
    echoResponse(200, 'OK');
});

//delete order
$app->delete('/order_items/:id', function ($id) {
    $response = array();
    $db = new DbHandler();
    if (!isAuthenticated()){
        echoResponse(403, "Not authenticated");
        return;
    }
    $q = "delete from order_items where order_item_id=".$id;
    $res = $db->execute($q);
    echoResponse(200, 'OK');
});

//get all/one order
$app->get('/orders(/:id)', function ($id=null) use ($app) {
    //echoResponse(200, var_dump($id)); return;
    $response = array();
    $db = new DbHandler();
    if (!isAuthenticated()){
        echoResponse(403, "Not authenticated");
        return;
    }
    $q = "select * from orders";
    if (isset($id)){
        $q .= " WHERE order_id=".$id;
    }
    $q .= " ORDER BY confirmation_date DESC, confirmation_number DESC";
    $res = $db->getRecords($q);

    while ($row = $res->fetch_assoc()) {        
        $row["order_id"] = (int)$row["order_id"];
        $row["status_id"] = (int)$row["status_id"];
        $row["client_id"] = (int)$row["client_id"];
        $response[] = $row;
    }
    echoResponse(200, $response);
});

//delete order
$app->delete('/orders/:id', function ($id) {
    $response = array();
    $db = new DbHandler();
    if (!isAuthenticated()){
        echoResponse(403, "Not authenticated");
        return;
    }
    $q = "delete from orders where order_id=".$id;
    $res = $db->execute($q);
    echoResponse(200, 'OK');
});

//update order
$app->put('/orders', function () use ($app) {
    $res = json_decode($app->request->getBody());
    $response = array();
    $db = new DbHandler();
    if (!isAuthenticated()){
        echoResponse(403, "Not authenticated");
        return;
    }
    $q = "UPDATE orders SET client_id=?, status_id=?, confirmation_number=?, confirmation_date=?, supply_date=?, proform_number=?, paid=? WHERE order_id=?";

    $stmt = $db->conn->stmt_init();
    $stmt->prepare($q);
    $stmt->bind_param('ddssssdd',$res->client_id, $res->status_id, $res->confirmation_number, $res->confirmation_date, $res->supply_date, $res->proform_number, $res->paid, $res->order_id);
    $stmt->execute();
    echoResponse(200, $app->request->getBody());
});

//create order
$app->post('/orders', function () use ($app) {
    
    //echoResponse(200, );return;
    $res = json_decode($app->request->getBody());
    $db = new DbHandler();
    if (!isAuthenticated()){
        echoResponse(403, "Not authenticated");
        return;
    }
    $q = "INSERT INTO orders SET client_id=?, status_id=?, confirmation_number=?, confirmation_date=?, supply_date=?, proform_number=?, paid=0";

    $stmt = $db->conn->stmt_init();
    $stmt->prepare($q);
    $stmt->bind_param('ddssss',$res->client_id, $res->status_id, $res->confirmation_number, $res->confirmation_date, $res->supply_date, $res->proform_number);
    $stmt->execute();
    $response = $stmt->insert_id;
    echoResponse(200, $response);
});