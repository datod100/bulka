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

$app->get('/docs/packinglist/:order_id', function ($order_id) use ($app) {
    //echoResponse(200, var_dump($id)); return;
    $response = array();
    $db = new DbHandler();
    $x_offset = 150;
        
    // initiate PDF
    $pdf = new Pdf();
    $pdf->SetMargins(0, 0, 0);
    
    // add a page
    $pdf->AddPage("L", "A4");
    
    
    $pdf->setRTL(true);
    // get external file content
    $pl_number = '15125';
    $date = '02/11/2018';    
    $client = 'לחם הכפר אלפי מנשה';
    //$client = 'מרקט העיר';

    $products = array();
    $q = "select * from products ORDER BY sort_order";
    $res = $db->getRecords($q);

    while ($row = $res->fetch_assoc()) {
        $row['product_id'] = (int)$row['product_id'];
        $row['sort_order'] = (int)$row['sort_order'];
        $products[] = $row;
    }

    //echoResponse(200, var_dump($products)); return;
    $pdf->SetFont('freeserifb', '', 16);
    $pdf->SetXY(46, 44.5);
    $pdf->Write(5, $pl_number);
    $pdf->SetXY(46 + $x_offset, 44.5);
    $pdf->Write(5, $pl_number);
    
    // date
    $pdf->SetFont('freeserif', '', 13);
    $pdf->SetXY(106, 45.5);
    $pdf->Write(5, $date);
    $pdf->SetXY(106 + $x_offset, 45.5);
    $pdf->Write(5, $date);

    //client
    $pdf->SetXY(24, 53);
    $pdf->Write(5, $client);
    $pdf->SetXY(24 + $x_offset, 53);
    $pdf->Write(5, $client);

    for ($i=0;$i<count($products);$i++){
        $pdf->SetXY(12, 74.5+$i*8.2);
        $pdf->Write(5, $products[$i]['name']);        
        $pdf->SetX(81.5);
        $pdf->Write(5, $i);
        
        $pdf->SetX(12 + $x_offset);
        $pdf->Write(5, $products[$i]['name']);
        $pdf->SetX(81.5 + $x_offset);
        $pdf->Write(5, $i);
    }

    $pdf->Output();
    exit;
});