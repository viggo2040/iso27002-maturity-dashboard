
<?php
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Pragma: no-cache');
error_reporting(E_ALL);
ini_set('display_errors', '0');
try {
    $config = require __DIR__ . '/config.php';
    $dataFile = $config['data_file'];
    if (!is_string($dataFile) || $dataFile === '') { http_response_code(500); echo json_encode(['error' => 'Ruta de data_file inválida en config.php']); exit; }
    if (!file_exists($dataFile)) { http_response_code(404); echo json_encode(['error' => 'Data file not found', 'path' => $dataFile]); exit; }
    if (!is_readable($dataFile)) { http_response_code(500); echo json_encode(['error' => 'Data file not readable', 'path' => $dataFile]); exit; }
    $handle = fopen($dataFile, 'r'); if ($handle === false) { http_response_code(500); echo json_encode(['error' => 'Unable to open data file', 'path' => $dataFile]); exit; }
    $header = fgetcsv($handle); if ($header === false) { fclose($handle); http_response_code(400); echo json_encode(['error' => 'CSV header missing']); exit; }
    $header = array_map(function($h){ return trim(preg_replace('/^\xEF\xBB\xBF/', '', (string)$h)); }, $header);
    $cols = array_flip($header);
    $required = ['Dominio_ISO27002','Nro_Control','Nombre_Control','Nivel_SCF','Valor_Madurez'];
    foreach ($required as $r) { if (!isset($cols[$r])) { fclose($handle); http_response_code(400); echo json_encode(['error' => "Missing required column: $r", 'received_header' => $header]); exit; } }
    $sum=[]; $count=[]; $total=0;
    while(($row=fgetcsv($handle))!==false){
      if(count($row)<count($header)) continue;
      $dom=trim((string)$row[$cols['Dominio_ISO27002']]);
      $val=floatval(str_replace(',', '.', (string)$row[$cols['Valor_Madurez']]));
      if($dom==='' || !is_numeric($val)) continue;
      if(!isset($sum[$dom])){ $sum[$dom]=0.0; $count[$dom]=0; }
      $sum[$dom]+=$val; $count[$dom]+=1; $total++;
    }
    fclose($handle);
    $result=[];
    foreach($sum as $dom=>$s){ $avg=$count[$dom]>0?($s/$count[$dom]):0.0; $result[]=['Dominio_ISO27002'=>$dom,'Madurez_Promedio'=>round($avg,3)]; }
    usort($result,function($a,$b){ return $b['Madurez_Promedio'] <=> $a['Madurez_Promedio']; });
    echo json_encode(['data'=>$result,'meta'=>['records'=>$total,'domains'=>count($result),'source'=>basename($dataFile)]], JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES);
} catch (Throwable $e) { http_response_code(500); error_log('summary.php error: '.$e->getMessage()); echo json_encode(['error'=>'Internal error in summary.php']); }
