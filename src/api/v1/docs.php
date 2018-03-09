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
                $this->setSourceFile('pdf/packinglist.pdf');
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
        
    // initiate PDF
    $pdf = new Pdf();
    $pdf->SetMargins(PDF_MARGIN_LEFT, 40, PDF_MARGIN_RIGHT);
    $pdf->SetAutoPageBreak(true, 40);
    
    // add a page
    $pdf->AddPage();
    
    
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
    $pdf->SetFont('freeserifb', '', 20);
    // now write some text above the imported page
    $pdf->SetXY(70, 63.5);
    $pdf->Write(5, $pl_number);
    
    $pdf->SetFontSize(17);
    $pdf->SetXY(140, 46.5);
    $pdf->Write(5, 'מקור');


    // date
    $pdf->SetFont('freeserif', '', 16);
    $pdf->SetXY(150, 65);
    $pdf->Write(5, $date);

    //client
    $pdf->SetXY(37, 80);
    $pdf->Write(5, $client);

    for ($i=0;$i<count($products);$i++){
        $pdf->SetXY(20, 107.5+$i*9.1);
        $pdf->Write(5, $products[$i]['name']);
        
        $pdf->SetX(116);
        $pdf->Write(5, $i);
    }

    $pdf->Output();
    exit;
});