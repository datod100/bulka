<?php
use setasign\Fpdi;

class Pdf extends Fpdi\TcpdfFpdi
    {
        /**
         * "Remembers" the template id of the imported page
         */
        protected $tplId;
    
        /**
         * Draw an imported PDF logo on every page
         */
        function Header()
        {
            if (is_null($this->tplId)) {                
                $this->setSourceFile('pdf/packinglist-dual.pdf');
                $this->tplId = $this->importPage(1);
            }
            $size = $this->useImportedPage($this->tplId);
        }
    
        function Footer()
        {
            // emtpy method body
        }
    }

$app->get('/docs/packinglist/:order_id/:indecies', function ($order_id, $indecies) use ($app) {
    //echoResponse(200, var_dump($id)); return;
    $response = array();
    $db = new DbHandler();
     
    if (!isAuthenticated()){
        echoResponse(403, "Not authenticated");
        return;
    }

    // initiate PDF
    $pdf = new Pdf();
    $pdf->SetMargins(0, 0, 0);    
    $pdf->setRTL(true);

    $indecies = explode(",",$indecies);

    $q = "SELECT DISTINCT index_id FROM `orders` WHERE order_id=? ORDER BY `index_id`";
    $stmt = $db->conn->stmt_init();
    $stmt->prepare($q);
    $stmt->bind_param('d',$order_id);
    $stmt->execute();
    $res = $stmt->get_result();

    $index_ids = array();
    $i=0;
    while ($row = $res->fetch_assoc()) {
        if (in_array($i, $indecies)){
            $index_ids[] = $row['index_id'];
        }
        $i++;
    }

    for ($index=0; $index < count($index_ids); $index++){
        createInvoice($pdf, $db, $order_id, $index, $index_ids[$index]);
    }

    $pdf->Output('Invoice '. date("m-d-Y").'.pdf','D');
    exit;
});


function createInvoice(&$pdf, &$db, $order_id, $index, $index_id){
    $x_offset = 150;
    $group_names = array("א", "ב", "ג", "ד", "ה", "ו", "ז", "ח","ט","י",'י"א','י"ב');
   
    $q = "SELECT DISTINCT od.order_date, c.name client_name, p.name product_name, cp.price, o.invoice_number, o.group_id,o.supply_time, c.group_order, op.*
    FROM `order_products` op INNER JOIN products p ON op.product_id=p.product_id INNER JOIN orders o ON (op.order_id = o.order_id AND op.index_id = o.index_id)
    INNER JOIN clients c ON c.client_id=o.client_id INNER JOIN client_product_price cp ON (c.client_id=cp.client_id AND p.product_id = cp.product_id)
    INNER JOIN order_date od ON od.order_id = o.order_id
    WHERE o.index_id=?
    ORDER BY p.sort_order";

    $stmt = $db->conn->stmt_init();
    $stmt->prepare($q);
    $stmt->bind_param('d',$index_id);
    $stmt->execute();
    $res = $stmt->get_result();

    $products = array();
    while ($row = $res->fetch_assoc()) {
        $row['product_id'] = (int)$row['product_id'];
        $row['group_order'] = (int)$row['group_order'];
        $row['group_id'] = (int)$row['group_id'];
        $row['supply_time'] = substr($row['supply_time'], 0, -3);
        $row['order_date'] = date('d/m/Y',strtotime($row['order_date']. ' + 1 day'));
        $row['group_name'] = "קבוצה " . $group_names[ $row['group_id'] ] . "'";
        $products[] = $row;
    }

    if (count($products)==0){
        return;
    }

    // add a page
    $pdf->AddPage("L", "A4");

    //echoResponse(200, var_dump($products)); return;
    $pdf->SetFont('freeserifb', '', 16);
    $pdf->SetXY(46, 44.5);
    $pdf->Write(5, $products[0]['invoice_number']);
    $pdf->SetX(46 + $x_offset);
    $pdf->Write(5,  $products[0]['invoice_number']);
    
    // date
    $pdf->SetFont('freeserif', '', 13);
    $pdf->SetXY(106, 45.5);
    $pdf->Write(5, $products[0]['order_date']);
    $pdf->SetX(106 + $x_offset);
    $pdf->Write(5, $products[0]['order_date']);

    //client
    $pdf->SetXY(24, 53);
    $pdf->Write(5, $products[0]['client_name']);
    $pdf->SetX(24 + $x_offset);
    $pdf->Write(5, $products[0]['client_name']);

    
    //supply_time
    $pdf->SetXY(118, 53);
    $pdf->Write(5, $products[0]['supply_time']);
    $pdf->SetX(118 + $x_offset);
    $pdf->Write(5, $products[0]['supply_time']);


    $pdf->SetFont('freeserif', '', 10);
    $pdf->SetXY(8, 59);
    $pdf->Write(5, $products[0]['group_name']. " (" . $products[0]['group_order'].")");
    $pdf->SetX(8 + $x_offset);
    $pdf->Write(5, $products[0]['group_name']. " (" . $products[0]['group_order'].")");

    $pdf->SetFont('freeserif', '', 13);
    $total = 0;
    for ($i=0;$i<count($products);$i++){
        $pdf->SetXY(12, 74.5+$i*8.2);
        $pdf->Write(5, $products[$i]['product_name']);
        $pdf->SetX(79);
        $pdf->Write(5, $products[$i]['quantity']);
        $pdf->SetX(108);
        $pdf->Write(5, "₪");
        $pdf->SetX(95);
        $pdf->Write(5, number_format($products[$i]['price'],2));
        //$pdf->SetX(132);
        //$pdf->Write(5, "₪");
        $pdf->SetX(117);
        $pdf->Write(5, number_format($products[$i]['price']*$products[$i]['quantity'],2));
        $total += $products[$i]['price']*$products[$i]['quantity'];
        
        $pdf->SetX(12 + $x_offset);
        $pdf->Write(5, $products[$i]['product_name']);
        $pdf->SetX(79 + $x_offset);
        $pdf->Write(5, $products[$i]['quantity']);
        $pdf->SetX(108 + $x_offset);
        $pdf->Write(5, "₪");
        $pdf->SetX(95 + $x_offset);
        $pdf->Write(5,  number_format($products[$i]['price'],2));
        //$pdf->SetX(132 + $x_offset);
        //$pdf->Write(5, "₪");
        $pdf->SetX(117 + $x_offset);
        $pdf->Write(5, number_format($products[$i]['price']*$products[$i]['quantity'],2));
    }
    $pdf->SetFont('freeserifb', '', 13);
    $pdf->SetXY(98, 172.9);
    $pdf->Write(5, 'סה"כ');
    //$pdf->SetX(132);
    //$pdf->Write(5, "₪");
    $pdf->SetX(117);
    $pdf->Write(5, number_format($total,2));

    $pdf->SetXY(98 + $x_offset, 172.9);
    $pdf->Write(5, 'סה"כ');
    //$pdf->SetX(132 + $x_offset);
    //$pdf->Write(5, "₪");
    $pdf->SetX(117 + $x_offset);
    $pdf->Write(5, number_format($total,2));
}