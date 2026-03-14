## This code requires PyMuPDF (pip install PyMuPDF).

import fitz  # PyMuPDF
import os
import re

def extract_questions_final(pdf_file_path: str, pdf_folder_path: str):
    if not os.path.exists(pdf_folder_path):
        os.makedirs(pdf_folder_path)
        
    doc = fitz.open(pdf_file_path)
    questions = []
    
    # Matches "1.", ".1", "1", "שאלה 1", "שאלה 1."
    q_pattern = re.compile(r'^(?:שאלה\s+)?[\.\-]?\s*([1-9][0-9]*)\s*[\.\-]?\s*$')
    
    TOP_MARGIN = 65
    BOTTOM_MARGIN = 65
    
    # Keywords indicating the end of the test or cover pages to skip
    stop_words = ["נספח", "דפי נוסחאות", "תשובות סופיות"]
    cover_words = ["צוותי הוראה", "הוצאת", "לשימוש כבחינה"]
    stop_parsing = False

    # --- Pass 1: Detect Questions & Handle Chapter Headings ---
    for page_index in range(len(doc)):
        if stop_parsing: break
        
        page = doc[page_index]
        page_width = page.rect.width
        page_height = page.rect.height
        text_content = page.get_text("text")
        
        # Check if this is an appendix/answers page
        if any(sw in text_content[:500] for sw in stop_words):
            stop_parsing = True
            break
            
        # Check if this is a publisher cover page
        if any(cw in text_content for cw in cover_words):
            continue
            
        blocks = page.get_text("blocks")
        # Sort blocks by Y coordinate for sequential reading
        blocks.sort(key=lambda b: b[1]) 
        
        last_q_end_y = TOP_MARGIN
        
        for block in blocks:
            x0, y0, x1, y1, text, block_no, block_type = block
            
            if y0 < TOP_MARGIN or y1 > (page_height - BOTTOM_MARGIN):
                continue
                
            text_clean = text.strip()
            match = q_pattern.match(text_clean)
            
            # RTL Check: The right edge of the text (x1) must be in the right-most 30% of the page
            is_right_aligned = x1 > (page_width * 0.70)
            
            if match and is_right_aligned:
                q_num = int(match.group(1))
                
                # Upward Expansion (Iteration 10): 
                # Find orphaned text (like Chapter Titles) between the last question and this one
                start_y = y0
                blocks_above = [b for b in blocks if last_q_end_y < b[1] < y0 and b[6] == 0]
                if blocks_above:
                    start_y = min(b[1] for b in blocks_above)
                
                questions.append({
                    "q_num": q_num,
                    "page": page_index,
                    "y_start_text": start_y,
                    "y_end_elements": y1
                })
                
                # Update boundary for the next question's upward expansion
                last_q_end_y = y1 

    if not questions:
        print(f"No questions found in {pdf_file_path}.")
        doc.close()
        return

    # Sort sequentially just in case
    questions = sorted(questions, key=lambda x: (x["page"], x["y_start_text"]))

    # --- Pass 2: Word-Level & Graphical Bounding Boxes with Clamping ---
    for page_index in range(len(doc)):
        page = doc[page_index]
        page_qs = [q for q in questions if q["page"] == page_index]
        if not page_qs: continue
        
        # Word-level precision to catch math symbols extending downwards
        words = page.get_text("words")
        for word in words:
            wx0, wy0, wx1, wy1, w_text, block_no, line_no, word_no = word
            for i, q in enumerate(page_qs):
                next_y = page_qs[i+1]["y_start_text"] if i + 1 < len(page_qs) else page.rect.height
                if q["y_start_text"] - 10 <= wy0 < next_y:
                    q["y_end_elements"] = max(q["y_end_elements"], wy1)
                    
        # Elements (Drawings, Graphs, Images) with bottom-clamping
        drawings = page.get_drawings()
        images = page.get_images(full=True)
        
        def assign_and_clamp(elem_y0, elem_y1):
            for i, q in enumerate(page_qs):
                next_y = page_qs[i+1]["y_start_text"] if i + 1 < len(page_qs) else page.rect.height
                if q["y_start_text"] - 20 <= elem_y0 < next_y:
                    # Clamp the bottom so transparent images don't swallow the next question
                    clamped_y1 = min(elem_y1, next_y - 5)
                    q["y_end_elements"] = max(q["y_end_elements"], clamped_y1)

        for draw in drawings:
            assign_and_clamp(draw["rect"].y0, draw["rect"].y1)
            
        for img in images:
            xref = img[0]
            for rect in page.get_image_rects(xref):
                assign_and_clamp(rect.y0, rect.y1)

    # --- Pass 3: Whitespace Mid-Gap Calculation ---
    for i in range(len(questions)):
        current_q = questions[i]
        
        if i + 1 < len(questions) and questions[i+1]["page"] == current_q["page"]:
            next_q = questions[i+1]
            gap_start = current_q["y_end_elements"]
            gap_end = next_q["y_start_text"]
            
            # Find the dead center of the whitespace between questions
            cut_y = gap_start + ((gap_end - gap_start) / 2) if gap_end > gap_start else gap_end - 2
            current_q["crop_y_bottom"] = cut_y
            next_q["crop_y_top"] = cut_y
        else:
            # Question ends at the bottom of the page
            current_q["crop_y_bottom"] = doc[current_q["page"]].rect.height - BOTTOM_MARGIN
            
        if "crop_y_top" not in current_q:
             current_q["crop_y_top"] = TOP_MARGIN

    # --- Pass 4: Page Cropping and Assembly ---
    for i, q in enumerate(questions):
        q_doc = fitz.open()
        
        # Calculate the page index where the question ends
        end_page_idx = questions[i+1]["page"] if i + 1 < len(questions) else len(doc) - 1
        if i + 1 < len(questions) and questions[i+1]["page"] > q["page"]:
            end_page_idx = questions[i+1]["page"] - 1
            
        end_page_idx = max(q["page"], min(end_page_idx, len(doc) - 1))
        
        for p_idx in range(q["page"], end_page_idx + 1):
            q_doc.insert_pdf(doc, from_page=p_idx, to_page=p_idx)
            new_page = q_doc[-1]
            rect = new_page.rect
            
            crop_top = q.get("crop_y_top", TOP_MARGIN) if p_idx == q["page"] else TOP_MARGIN
            crop_bottom = q.get("crop_y_bottom", rect.height - BOTTOM_MARGIN) if p_idx == end_page_idx else rect.height - BOTTOM_MARGIN
            
            # Apply layout-preserving cropbox
            new_rect = fitz.Rect(rect.x0, crop_top, rect.x1, crop_bottom)
            new_page.set_cropbox(new_rect)
            
        output_path = os.path.join(pdf_folder_path, f"Question_{q['q_num']}.pdf")
        q_doc.save(output_path)
        q_doc.close()
        
    doc.close()