<?php
$app->get('/refunds/today', function () use ($app) {
    $res = json_decode($app->request->getBody());
    //echoResponse(200,$res );return;
    $db = new DbHandler();
    if (!isAuthenticated()){
        echoResponse(403, "Not authenticated");
        return;
    }
    $q= "INSERT INTO `refund_date` (`refund_date`)
    SELECT date(now()) FROM DUAL WHERE NOT EXISTS (
        SELECT `refund_date` FROM refund_date WHERE refund_date= date(now())
    ) LIMIT 1;";

    $stmt = $db->conn->stmt_init();
    $stmt->prepare($q);
    $stmt->execute();
    $refund_id = $stmt->insert_id;

    if ($refund_id == 0){
        $q= "SELECT refund_date, refund_id FROM refund_date WHERE refund_date= date(now())";
        $result = $db->getOneRecord($q);
        $result["refund_id"] = (int)$result["refund_id"];
    }
    
    echoResponse(200, $result);
});

$app->get('/refunds/:refund_id', function ($refund_id) use ($app) {
    $res = json_decode($app->request->getBody());
    $db = new DbHandler();
    if (!isAuthenticated()){
        echoResponse(403, "Not authenticated");
        return;
    }

    if ($refund_id == 0){
        $q= "SELECT refund_date, refund_id FROM refund_date WHERE refund_date= date(now())";
        $result = $db->getOneRecord($q);
        $result["refund_id"] = (int)$result["refund_id"];
    }
    
    echoResponse(200, $result);
});


$app->get('/refunds/date/:date', function ($date) use ($app) {
    $res = json_decode($app->request->getBody());
    $db = new DbHandler();
    if (!isAuthenticated()){
        echoResponse(403, "Not authenticated");
        return;
    }
    $date = substr($date,0,10);
    $date = date('Y-m-d', strtotime($date. ' + 1 days'));
    
    $q= "SELECT refund_date, refund_id FROM refund_date WHERE refund_date=? LIMIT 1";     
    $stmt = $db->conn->stmt_init();
    $stmt->prepare($q);
    $stmt->bind_param('s',$date);
    $stmt->execute();        
    $result = $stmt->get_result();
    $row = $result->fetch_assoc();
    $row["refund_id"] = (int)$row["refund_id"];
    
    echoResponse(200, $row);
});

// order all order products
$app->get('/refunds/products/:refund_id', function ($refund_id) use ($app) {
    $response = array();
    $db = new DbHandler();
    if (!isAuthenticated()){
        echoResponse(403, "Not authenticated");
        return;
    }
    $q = "SELECT * FROM refund_products WHERE refund_id=?";
    $stmt = $db->conn->stmt_init();
    $stmt->prepare($q);
    $stmt->bind_param("d", $refund_id);
    $stmt->execute();
    $result = $stmt->get_result();

    while ($row = $result->fetch_assoc()) {
        $row["refund_id"] = (int)$row["refund_id"];
        $row["product_id"] = (int)$row["product_id"];
        $row["client_id"] = (int)$row["client_id"];
        $row["quantity"] = (int)$row["quantity"];
        $response[] = $row;
    }
    echoResponse(200, $response);
});


//save refund items
$app->put('/refunds/save', function () use ($app) {
    $items = json_decode($app->request->getBody());
    $response = array();
    $db = new DbHandler();
    if (!isAuthenticated()){
        echoResponse(403, "Not authenticated");
        return;
    }

    $q = "DELETE FROM `refund_products` WHERE refund_id=?";
    $stmt = $db->conn->stmt_init();
    $stmt->prepare($q);
    $stmt->bind_param('d',$items[0]->refund_id);
    $stmt->execute();

    for($i = 0; $i < count($items); ++$i) {    
        $q = "INSERT INTO `refund_products` (`refund_id`, `client_id`, `product_id`, `quantity`) VALUES (?,?,?,?)";
        $stmt = $db->conn->stmt_init();
        $stmt->prepare($q);
        $stmt->bind_param('dddd',$items[$i]->refund_id, $items[$i]->client_id, $items[$i]->product_id, $items[$i]->quantity);
        $stmt->execute();
        $index_id[] = $stmt->insert_id;
    }

    echoResponse(200, $index_id);
});
