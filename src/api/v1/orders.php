<?php
// order all summary items
$app->get('/order/summary/:order_id', function ($order_id) use ($app) {
    //echoResponse(200, var_dump($id)); return;
    $response = array();
    $db = new DbHandler();
    if (!isAuthenticated()){
        echoResponse(403, "Not authenticated");
        return;
    }
    $q = "select * from order_summary WHERE order_id=?";
    $stmt = $db->conn->stmt_init();
    $stmt->prepare($q);
    $stmt->bind_param('d', $order_id);
    $stmt->execute();
    $result = $stmt->get_result();

    while ($row = $result->fetch_assoc()) {
        $row["cycle_id"] = (int)$row["cycle_id"];
        $row["order_id"] = (int)$row["order_id"];
        $row["product_id"] = (int)$row["product_id"];
        $row["quantity"] = (int)$row["quantity"];
        $response[] = $row;
    }
    echoResponse(200, $response);
});

// order all order products
$app->get('/order/products/:order_id', function ($order_id) use ($app) {
    $response = array();
    $db = new DbHandler();
    if (!isAuthenticated()){
        echoResponse(403, "Not authenticated");
        return;
    }
    $q = "SELECT op.* FROM order_products op INNER JOIN orders o ON op.index_id=o.index_id WHERE o.order_id=?";
    $stmt = $db->conn->stmt_init();
    $stmt->prepare($q);
    $stmt->bind_param("d", $order_id);
    $stmt->execute();
    $result = $stmt->get_result();

    while ($row = $result->fetch_assoc()) {
        $row["index_id"] = (int)$row["index_id"];
        $row["product_id"] = (int)$row["product_id"];
        $row["quantity"] = (int)$row["quantity"];
        $row["price"] = (float)$row["price"];
        $response[] = $row;
    }
    echoResponse(200, $response);
});

//save summary items
$app->put('/order/summary/save', function () use ($app) {
    $items = json_decode($app->request->getBody());
    $response = array();
    $db = new DbHandler();
    if (!isAuthenticated()){
        echoResponse(403, "Not authenticated");
        return;
    }

    $q = "DELETE FROM `order_summary` WHERE order_id=?";
    $stmt = $db->conn->stmt_init();
    $stmt->prepare($q);
    $stmt->bind_param('d',$items[0]->order_id);
    $stmt->execute();

    for($i = 0; $i < count($items); ++$i) {    
        $q = "INSERT INTO `order_summary`(`index_id`, `order_id`, `cycle_id`, `product_id`, `quantity`) VALUES (?,?,?,?,?)";
        $stmt = $db->conn->stmt_init();
        $stmt->prepare($q);
        $stmt->bind_param('ddddd',$items[$i]->index_id, $items[$i]->order_id, $items[$i]->cycle_id, $items[$i]->product_id, $items[$i]->quantity);
        $stmt->execute();
    }

    echoResponse(200, 'OK');
});

//create or get order for today
$app->get('/orders/today', function () use ($app) {
    $res = json_decode($app->request->getBody());
    //echoResponse(200,$res );return;
    $db = new DbHandler();
    if (!isAuthenticated()){
        echoResponse(403, "Not authenticated");
        return;
    }
    $q= "INSERT INTO `order_date` (`order_date`)
    SELECT date(now()) FROM DUAL WHERE NOT EXISTS (
        SELECT `order_date` FROM order_date WHERE order_date= date(now())
    ) LIMIT 1;";

    $stmt = $db->conn->stmt_init();
    $stmt->prepare($q);
    $stmt->execute();
    $result["order_id"] = $stmt->insert_id;

    $q= "SELECT order_date, order_id FROM order_date WHERE order_date= date(now())";
    $result = $db->getOneRecord($q);
    $result["order_id"] = (int)$result["order_id"];    
    
    echoResponse(200, $result);
});


//create or get order for specific date
$app->get('/orders/create/:date', function ($date) use ($app) {
    $res = json_decode($app->request->getBody());
    //echoResponse(200,$res );return;
    $db = new DbHandler();
    // if (!isAuthenticated()){
    //     echoResponse(403, "Not authenticated");
    //     return;
    // }
    $q= "INSERT INTO `order_date` (`order_date`)
    SELECT ? FROM DUAL WHERE NOT EXISTS (
        SELECT `order_date` FROM order_date WHERE order_date= ?
    ) LIMIT 1;";

    $stmt = $db->conn->stmt_init();
    $stmt->prepare($q);
    $stmt->bind_param('ss',$date, $date);
    $stmt->execute();
    $result["order_id"] = $stmt->insert_id;

    $q= "SELECT order_date, order_id FROM order_date WHERE (order_id=? OR order_date=?)";
    $stmt = $db->conn->stmt_init();
    $stmt->prepare($q);
    $stmt->bind_param('ds',$result["order_id"], $date);
    $stmt->execute();        
    $result = $stmt->get_result();
    $row = $result->fetch_assoc();
    $row["order_id"] = (int)$row["order_id"];    
    
    echoResponse(200, $row);
});

$app->get('/servertime', function () use ($app) {
    $db = new DbHandler();
    if (!isAuthenticated()){
        echoResponse(403, "Not authenticated");
        return;
    }
    echoResponse(200, date('d/m/Y'));
});

$app->get('/orders/id/:order_id', function ($order_id) use ($app) {
    $res = json_decode($app->request->getBody());
    $db = new DbHandler();
    if (!isAuthenticated()){
        echoResponse(403, "Not authenticated");
        return;
    }

    if ($order_id != 0){
        $q= "SELECT order_date, order_id FROM order_date WHERE order_id=? LIMIT 1";
        $stmt = $db->conn->stmt_init();
        $stmt->prepare($q);
        $stmt->bind_param('d',$order_id);
        $stmt->execute();        
        $result = $stmt->get_result();
        $row = $result->fetch_assoc();
        $row["order_id"] = (int)$row["order_id"];
    }
    
    echoResponse(200, $row);
});

$app->get('/orders/date/:date', function ($date) use ($app) {
    $res = json_decode($app->request->getBody());
    $db = new DbHandler();
    if (!isAuthenticated()){
        echoResponse(403, "Not authenticated");
        return;
    }
    //$date = substr($date,0,10);
    //$date = date('Y-m-d', strtotime($date. ' + 1 days'));
    
    $q= "SELECT order_date, order_id FROM order_date WHERE order_date=? LIMIT 1";     
    $stmt = $db->conn->stmt_init();
    $stmt->prepare($q);
    $stmt->bind_param('s',$date);
    $stmt->execute();        
    $result = $stmt->get_result();
    $row = $result->fetch_assoc();
    $row["order_id"] = (int)$row["order_id"];
    
    echoResponse(200, $row);
});

//get active days
$app->get('/orders/active_dates/:month/:year', function ($month, $year) use ($app) {
    //echoResponse(200, var_dump($id)); return;
    $response = array();
    $db = new DbHandler();
    if (!isAuthenticated()){
        echoResponse(403, "Not authenticated");
        return;
    }
    $q = "SELECT order_date FROM `order_date` WHERE MONTH(order_date)=? AND YEAR(order_date)=?";
    $stmt = $db->conn->stmt_init();
    $stmt->prepare($q);
    $stmt->bind_param('ss',$month,$year);
    $stmt->execute();
    $result = $stmt->get_result();

    while ($row = $result->fetch_assoc()) {
        $response[] = $row;
    }
    echoResponse(200, $response);
});

//get one order
$app->get('/orders/:filter', function ($filter=null) use ($app) {
    //echoResponse(200, var_dump($id)); return;
    $response = array();
    $db = new DbHandler();
    if (!isAuthenticated()){
        echoResponse(403, "Not authenticated");
        return;
    }
    $q = "SELECT o.* FROM `order_date` od INNER JOIN `orders` o ON od.order_id = o.order_id WHERE (od.order_date = ? OR od.order_id = ?) ORDER BY o.sort_order, o.index_id";
    $stmt = $db->conn->stmt_init();
    $stmt->prepare($q);
    $stmt->bind_param('ss',$filter,$filter);
    $stmt->execute();
    $result = $stmt->get_result();

    while ($row = $result->fetch_assoc()) {
        $row["index_id"] = (int)$row["index_id"];
        $row["sort_order"] = (int)$row["sort_order"];
        $row["order_id"] = (int)$row["order_id"];
        $row["client_id"] = (int)$row["client_id"];
        $row["status_id"] = (int)$row["status_id"];
        $row["group_id"] = (int)$row["group_id"];
        $row['supply_time'] = substr($row['supply_time'], 0, -3);
        $row["invoice_number"] = (int)$row["invoice_number"];
        $response[] = $row;
    }
    echoResponse(200, $response);
});

//save summary items
$app->put('/orders/save', function () use ($app) {
    $items = json_decode($app->request->getBody());
    $response = array();
    $db = new DbHandler();
    if (!isAuthenticated()){
        echoResponse(403, "Not authenticated");
        return;
    }

    $q = "DELETE FROM `orders` WHERE order_id=?";
    $stmt = $db->conn->stmt_init();
    $stmt->prepare($q);
    $stmt->bind_param('d',$items[0]->order_id);
    $stmt->execute();

    for($i = 0; $i < count($items); ++$i) {
        $q = "INSERT INTO `orders` (`sort_order`, `order_id`, `client_id`, `status_id`, `group_id`, `supply_time`, `invoice_number`) VALUES (?,?,?,?,?,?,?)";
        $stmt = $db->conn->stmt_init();
        $stmt->prepare($q);
        $stmt->bind_param('dddddsd',$items[$i]->sort_order, $items[$i]->order_id, $items[$i]->client_id, $items[$i]->status_id, $items[$i]->group_id, $items[$i]->supply_time, $items[$i]->invoice_number);
        $stmt->execute();
        $index_id[] = $stmt->insert_id;
    }

    echoResponse(200, $index_id);
});

$app->get('/orders/update_invoice_number/:index_id', function ($index_id) use ($app) {
    $response = array();
    $db = new DbHandler();
    if (!isAuthenticated()){
        echoResponse(403, "Not authenticated");
        return;
    }
    $q2 = "SELECT MAX(invoice_number)+1 id FROM orders";
    $r = $db->getRecords($q2);
    $row = $r->fetch_assoc();
    $invoice_number = $row['id'];
    if ($invoice_number==null) $invoice_number=1;

    $q = "UPDATE `orders` SET `invoice_number`=? WHERE index_id = ?";
    $stmt = $db->conn->stmt_init();
    $stmt->prepare($q);
    $stmt->bind_param('dd',$invoice_number, $index_id);
    $stmt->execute();
    $response['invoice_number'] = $invoice_number;
    $response['index_id'] = $index_id;

    echoResponse(200, $response);
});


//save order products
$app->put('/order/products/save', function () use ($app) {
    $items = json_decode($app->request->getBody());
    $response = array();
    $db = new DbHandler();
    if (!isAuthenticated()){
        echoResponse(403, "Not authenticated");
        return;
    }

    $q = "DELETE FROM `order_products` WHERE order_id=?";
    $stmt = $db->conn->stmt_init();
    $stmt->prepare($q);
    $stmt->bind_param('d',$items[0]->order_id);
    $stmt->execute();

    for($i = 0; $i < count($items); ++$i) {    
        $q = "INSERT INTO `order_products` (`index_id`, `order_id`, `product_id`, `quantity`, `price`) VALUES (?,?,?,?,?)";
        $stmt = $db->conn->stmt_init();
        $stmt->prepare($q);
        $stmt->bind_param('ddddd',$items[$i]->index_id, $items[$i]->order_id, $items[$i]->product_id, $items[$i]->quantity, $items[$i]->price);
        $stmt->execute();
        $index_id[] = $stmt->insert_id;
    }

    echoResponse(200, $index_id);
});