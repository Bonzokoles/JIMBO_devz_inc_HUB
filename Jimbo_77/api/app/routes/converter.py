"""
File Converter API - CAY Feed Converter Integration
REST API wrapper dla narzędzia CAY_FEED_conventer
Konwersja i dzielenie plików XML/JSON/CSV/YAML
"""

from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from fastapi.responses import FileResponse, StreamingResponse
from pydantic import BaseModel
from typing import Optional, List
import xml.etree.ElementTree as ET
import json
import yaml
import csv
import io
import os
import tempfile
from pathlib import Path
from datetime import datetime

router = APIRouter(prefix="/converter", tags=["converter"])

# Path do narzędzia
CONVERTER_PATH = Path("t:/M_PUMO_PROJEKT/CAY_FEED_conventer")

class ConvertRequest(BaseModel):
    input_format: str  # xml, json, csv, yaml
    output_format: str  # xml, json, csv, yaml
    content: Optional[str] = None
    url: Optional[str] = None

class SplitXMLRequest(BaseModel):
    split_tag: str  # Element name to split by (e.g., 'product')
    chunk_size: int = 1000  # Items per file

def split_xml_file_streaming(input_path: str, output_prefix: str, split_tag_localname: str, chunk_size: int = 1000):
    """
    Dzieli bardzo duży plik XML na części poprzez streaming.
    Zwraca listę ścieżek do wygenerowanych plików.
    """
    context = ET.iterparse(input_path, events=("start", "end"))
    _, root = next(context)

    nsmap = {k: v for k, v in root.attrib.items() if k.startswith('xmlns')}
    file_index = 1
    chunk_elements = []
    output_files = []

    def write_chunk(elements, index):
        new_root = ET.Element(root.tag, root.attrib)
        for k, v in nsmap.items():
            new_root.set(k, v)
        for el in elements:
            new_root.append(el)
        tree = ET.ElementTree(new_root)
        filename = f"{output_prefix}_part_{index}.xml"
        tree.write(filename, encoding='utf-8', xml_declaration=True)
        output_files.append(filename)
        return filename

    for event, elem in context:
        if event == "end" and elem.tag.split('}')[-1] == split_tag_localname:
            chunk_elements.append(elem)
            root.clear()
            if len(chunk_elements) >= chunk_size:
                write_chunk(chunk_elements, file_index)
                file_index += 1
                chunk_elements = []

    # Zapisz pozostałe elementy
    if chunk_elements:
        write_chunk(chunk_elements, file_index)

    return output_files

@router.post("/convert")
async def convert_file(
    file: UploadFile = File(...),
    input_format: str = Form(...),
    output_format: str = Form(...)
):
    """
    Konwertuj plik między formatami: XML, JSON, CSV, YAML
    
    Obsługiwane formaty:
    - xml → json, csv, yaml
    - json → xml, csv, yaml
    - csv → json, xml, yaml
    - yaml → json, xml, csv
    """
    try:
        # Read uploaded file
        content = await file.read()
        
        # Parse input based on format
        if input_format.lower() == 'json':
            data = json.loads(content)
        elif input_format.lower() == 'xml':
            root = ET.fromstring(content)
            # Convert XML to dict
            data = xml_to_dict(root)
        elif input_format.lower() == 'yaml':
            data = yaml.safe_load(content)
        elif input_format.lower() == 'csv':
            reader = csv.DictReader(io.StringIO(content.decode('utf-8')))
            data = list(reader)
        else:
            raise HTTPException(status_code=400, detail=f"Unsupported input format: {input_format}")
        
        # Convert to output format
        if output_format.lower() == 'json':
            output = json.dumps(data, indent=2, ensure_ascii=False)
            media_type = 'application/json'
            filename = f"converted_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        elif output_format.lower() == 'xml':
            root = dict_to_xml(data)
            output = ET.tostring(root, encoding='unicode')
            media_type = 'application/xml'
            filename = f"converted_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xml"
        elif output_format.lower() == 'yaml':
            output = yaml.dump(data, allow_unicode=True, default_flow_style=False)
            media_type = 'application/x-yaml'
            filename = f"converted_{datetime.now().strftime('%Y%m%d_%H%M%S')}.yaml"
        elif output_format.lower() == 'csv':
            if isinstance(data, list) and len(data) > 0:
                output_io = io.StringIO()
                writer = csv.DictWriter(output_io, fieldnames=data[0].keys())
                writer.writeheader()
                writer.writerows(data)
                output = output_io.getvalue()
            else:
                raise HTTPException(status_code=400, detail="Data must be a list for CSV conversion")
            media_type = 'text/csv'
            filename = f"converted_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
        else:
            raise HTTPException(status_code=400, detail=f"Unsupported output format: {output_format}")
        
        return StreamingResponse(
            io.BytesIO(output.encode('utf-8')),
            media_type=media_type,
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Conversion failed: {str(e)}")

@router.post("/split-xml")
async def split_xml(
    file: UploadFile = File(...),
    split_tag: str = Form(...),
    chunk_size: int = Form(1000)
):
    """
    Podziel duży plik XML na mniejsze części
    
    Args:
    - file: Plik XML do podziału
    - split_tag: Nazwa elementu po którym dzielić (np. 'product')
    - chunk_size: Liczba elementów w każdej części (default: 1000)
    
    Returns:
    - Archiwum ZIP z podzielonymi plikami
    """
    try:
        # Create temp directory
        with tempfile.TemporaryDirectory() as temp_dir:
            # Save uploaded file
            input_path = Path(temp_dir) / "input.xml"
            with open(input_path, 'wb') as f:
                f.write(await file.read())
            
            # Split XML
            output_prefix = str(Path(temp_dir) / "split")
            output_files = split_xml_file_streaming(
                str(input_path),
                output_prefix,
                split_tag,
                chunk_size
            )
            
            # Create ZIP archive
            import zipfile
            zip_path = Path(temp_dir) / "split_files.zip"
            with zipfile.ZipFile(zip_path, 'w') as zipf:
                for file_path in output_files:
                    zipf.write(file_path, os.path.basename(file_path))
            
            # Return ZIP
            return FileResponse(
                zip_path,
                media_type='application/zip',
                filename=f"split_{datetime.now().strftime('%Y%m%d_%H%M%S')}.zip"
            )
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Split failed: {str(e)}")

@router.get("/formats")
async def get_supported_formats():
    """
    Lista obsługiwanych formatów konwersji
    """
    return {
        "supported_formats": ["xml", "json", "csv", "yaml"],
        "conversions": {
            "xml": ["json", "csv", "yaml"],
            "json": ["xml", "csv", "yaml"],
            "csv": ["json", "xml", "yaml"],
            "yaml": ["json", "xml", "csv"]
        },
        "split_support": ["xml"]
    }

def xml_to_dict(element):
    """Convert XML element to dictionary"""
    result = {}
    
    # Add attributes
    if element.attrib:
        result['@attributes'] = element.attrib
    
    # Add text content
    if element.text and element.text.strip():
        if len(element) == 0:  # No children
            return element.text.strip()
        result['@text'] = element.text.strip()
    
    # Add children
    for child in element:
        child_data = xml_to_dict(child)
        tag = child.tag.split('}')[-1]  # Remove namespace
        
        if tag in result:
            # Multiple elements with same tag
            if not isinstance(result[tag], list):
                result[tag] = [result[tag]]
            result[tag].append(child_data)
        else:
            result[tag] = child_data
    
    return result if result else element.text

def dict_to_xml(data, root_name='root'):
    """Convert dictionary to XML element"""
    if isinstance(data, dict):
        root = ET.Element(root_name)
        
        for key, value in data.items():
            if key == '@attributes':
                for attr_key, attr_value in value.items():
                    root.set(attr_key, str(attr_value))
            elif key == '@text':
                root.text = str(value)
            else:
                if isinstance(value, list):
                    for item in value:
                        child = dict_to_xml(item, key)
                        root.append(child)
                else:
                    child = dict_to_xml(value, key)
                    root.append(child)
        
        return root
    else:
        element = ET.Element(root_name)
        element.text = str(data)
        return element
