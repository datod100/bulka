<?php

$app->get('/reports/refunds/:start_date/:end_date', function ($start_date, $end_date) use ($app) {
    //echoResponse(200, var_dump($id)); return;
    
    $db = new DbHandler();
    if (!isAuthenticated()){
        echoResponse(403, "Not authenticated");
        return;
    }
    $q = "SELECT o.client_id, op.product_id, SUM(op.price * op.quantity) total_sum, SUM(op.quantity) total_quantity
    FROM order_date od INNER JOIN orders o ON o.order_id = od.order_id INNER JOIN order_products op ON op.index_id = o.index_id
    WHERE (od.order_date BETWEEN ? AND ?) AND o.status_id=1
    GROUP BY o.client_id, op.product_id";
    $stmt = $db->conn->stmt_init();
    $stmt->prepare($q);
    $stmt->bind_param('ss', $start_date, $end_date);
    $stmt->execute();
    $result = $stmt->get_result();

    $orders = array();
    while ($row = $result->fetch_assoc()) {
        $row["client_id"] = (int)$row["client_id"];
        $row["product_id"] = (int)$row["product_id"];
        $row["total_quantity"] = (int)$row["total_quantity"];
        $row["total_sum"] = (float)$row["total_sum"];
        $orders[] = $row;
    }

    $q = "SELECT rp.refund_id, rp.product_id, rp.client_id, SUM(rp.price * rp.quantity) total_sum, SUM(rp.quantity) total_quantity FROM refund_date r INNER JOIN refund_products rp ON rp.refund_id=r.refund_id
    WHERE r.refund_date BETWEEN DATE_ADD(?, INTERVAL 1 DAY) AND DATE_ADD(?, INTERVAL 1 DAY)
    GROUP BY rp.client_id, rp.product_id";
    $stmt = $db->conn->stmt_init();
    $stmt->prepare($q);
    $stmt->bind_param('ss', $start_date, $end_date);
    $stmt->execute();
    $result = $stmt->get_result();

    $refunds = array();
    while ($row = $result->fetch_assoc()) {
        $row["refund_id"] = (int)$row["refund_id"];
        $row["product_id"] = (int)$row["product_id"];
        $row["client_id"] = (int)$row["client_id"];
        $row["total_quantity"] = (int)$row["total_quantity"];
        $row["total_sum"] = (float)$row["total_sum"];
        $refunds[] = $row;
    }

    echoResponse(200, [$orders, $refunds]);
});


$app->get('/reports/sales/:start_date/:end_date/:client_id', function ($start_date, $end_date, $client_id) use ($app) {
    //echoResponse(200, var_dump($id)); return;
    
    $db = new DbHandler();
    if (!isAuthenticated()){
        echoResponse(403, "Not authenticated");
        return;
    }
    $q = "SELECT DATE_ADD(od.order_date, INTERVAL 1 DAY) order_date, op.product_id, SUM(op.price * op.quantity) total_sum, SUM(op.quantity) total_quantity
    FROM order_date od INNER JOIN orders o ON o.order_id = od.order_id INNER JOIN order_products op ON op.index_id = o.index_id
    WHERE (od.order_date BETWEEN ? AND ?) AND o.status_id=1 AND o.client_id=?
    GROUP BY od.order_date, op.product_id";
    $stmt = $db->conn->stmt_init();
    $stmt->prepare($q);
    $stmt->bind_param('ssd', $start_date, $end_date, $client_id);
    $stmt->execute();
    $result = $stmt->get_result();

    $orders = array();
    while ($row = $result->fetch_assoc()) {
        $row["product_id"] = (int)$row["product_id"];
        $row["total_quantity"] = (int)$row["total_quantity"];
        $row["total_sum"] = (float)$row["total_sum"];
        $orders[] = $row;
    }

    $q = "SELECT r.refund_date, rp.refund_id, rp.product_id, SUM(rp.price * rp.quantity) total_sum, SUM(rp.quantity) total_quantity FROM refund_date r INNER JOIN refund_products rp ON rp.refund_id=r.refund_id
    WHERE r.refund_date BETWEEN DATE_ADD(?, INTERVAL 1 DAY) AND DATE_ADD(?, INTERVAL 1 DAY) AND rp.client_id=?
    GROUP BY r.refund_date, rp.product_id";
    $stmt = $db->conn->stmt_init();
    $stmt->prepare($q);
    $stmt->bind_param('ssd', $start_date, $end_date, $client_id);
    $stmt->execute();
    $result = $stmt->get_result();

    $refunds = array();
    while ($row = $result->fetch_assoc()) {
        $row["refund_id"] = (int)$row["refund_id"];
        $row["product_id"] = (int)$row["product_id"];
        $row["total_quantity"] = (int)$row["total_quantity"];
        $row["total_sum"] = (float)$row["total_sum"];
        $refunds[] = $row;
    }

    echoResponse(200, [$orders, $refunds]);
});