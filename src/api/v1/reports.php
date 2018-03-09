<?php

$app->get('/reports/refunds/:start_date/:end_date', function ($start_date, $end_date) use ($app) {
    //echoResponse(200, var_dump($id)); return;
    
    $db = new DbHandler();
    if (!isAuthenticated()){
        echoResponse(403, "Not authenticated");
        return;
    }
    $q = "SELECT o.client_id, op.product_id, SUM(op.quantity) total_quantity
    FROM order_date od INNER JOIN orders o ON o.order_id = od.order_id INNER JOIN order_products op ON op.index_id = o.index_id
    WHERE od.order_date >=? AND od.order_date<=? 
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
        $orders[] = $row;
    }

    $q = "SELECT rp.refund_id, rp.product_id, rp.client_id, SUM(rp.quantity) total_quantity FROM refund_date r INNER	JOIN refund_products rp ON rp.refund_id=r.refund_id
    WHERE r.refund_date BETWEEN ? AND ?
    GROUP BY rp.client_id, rp.product_id";
    $stmt = $db->conn->stmt_init();
    $stmt->prepare($q);
    $stmt->bind_param('ss', $start_date, $end_date);
    $stmt->execute();
    $result = $stmt->get_result();

    $refunds = array();
    while ($row = $result->fetch_assoc()) {
        $row["clienrefund_idt_id"] = (int)$row["refund_id"];
        $row["product_id"] = (int)$row["product_id"];
        $row["client_id"] = (int)$row["client_id"];
        $row["total_quantity"] = (int)$row["total_quantity"];
        $refunds[] = $row;
    }

    echoResponse(200, [orders, refunds]);
});