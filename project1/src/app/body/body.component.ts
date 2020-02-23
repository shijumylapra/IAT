import {
  Component, Input, ElementRef, AfterViewInit, ViewChild,OnInit
} from '@angular/core';

import { fromEvent } from 'rxjs';
import { switchMap, takeUntil, pairwise } from 'rxjs/operators'

@Component({
  selector: 'app-body' ,
  styleUrls: ['./body.component.css'],
  template: `
  <style>
   canvas { border: 1px solid #000; }
  </style>
  <div>
  <input #file type="file" accept='image/*' (change)="preview(file.files)" />
  </div>
    <div id="can">
      <canvas #canvas> </canvas>
      <img #spaceship [src]="imgURL" height="450" *ngIf="imgURL">
      <div class="footer">
      <input id="btn" type="button" value="JSON Output"  (click)="download_all_region_data()" /> 
 
      <span style="color:red;" *ngIf="message">{{message}}</span>
      </div>
    </div>
   
  `
})

export class BodyComponent implements OnInit {

  constructor() { }

  ngOnInit(): void {
  }
  public imagePath;
  public imgURL: any;
  public message: string;
  rect: any = {};
  drag: any = false;
  _via_img_metadata = {};
  imageBitmap = new Image();
  @ViewChild('canvas') public canvas: ElementRef;
  @Input() public width = 500;
  @Input() public height = 400;
  private cx: CanvasRenderingContext2D; 
  
  preview(files) {
  if (files.length === 0)
    return;
 var mimeType = files[0].type;
  if (mimeType.match(/image\/*/) == null) {
    this.message = "Only images are supported.";
    return;
  }
  var reader = new FileReader();
  this.imagePath = files;
  reader.readAsDataURL(files[0]); 
  reader.onload = (_event) => { 
  this.imgURL = reader.result; 
  this.loadCanvas();
 
  }
}



loadCanvas = function ()
{
   const canvasEl: HTMLCanvasElement = this.canvas.nativeElement;
  this.cx = canvasEl.getContext('2d');
  canvasEl.width = this.width;
  canvasEl.height = this.height;
  let image = new Image();
  image.src = this.imgURL;
  image.addEventListener('load', e => {
    this.cx.drawImage(image, 0, 0,  canvasEl.width,canvasEl.height);
  });
  this.cx.lineWidth = 3;
  this.cx.lineCap = 'round';
  this.cx.strokeStyle = '#000';
  this.captureEvents(canvasEl);
 } 

private captureEvents(canvasEl: HTMLCanvasElement) {
  // this will capture all mousedown events from the canvas element
  fromEvent(canvasEl, 'mousedown')
    .pipe(
      switchMap((e) => {
        // after a mouse down, we'll record all mouse moves
        return fromEvent(canvasEl, 'mousemove')
          .pipe(
            // we'll stop (and unsubscribe) once the user releases the mouse
            // this will trigger a 'mouseup' event    
            takeUntil(fromEvent(canvasEl, 'mouseup')),
            // we'll also stop (and unsubscribe) once the mouse leaves the canvas (mouseleave event)
            takeUntil(fromEvent(canvasEl, 'mouseleave')),
            // pairwise lets us get the previous value to draw a line from
            // the previous point to the current point    
            pairwise()
          )
      })
    )
    .subscribe((res: [MouseEvent, MouseEvent]) => {
      const rect = canvasEl.getBoundingClientRect();
      // previous and current position with the offset
      const prevPos = {
        x: res[0].clientX - rect.left,
        y: res[0].clientY - rect.top
      };

      const currentPos = {
        x: res[1].clientX - rect.left,
        y: res[1].clientY - rect.top
      };

      // this method we'll implement soon to do the actual drawing
      this.drawOnCanvas(prevPos, currentPos);
    });
}

private drawOnCanvas(prevPos: { x: number, y: number }, currentPos: { x: number, y: number }) {
  if (!this.cx) { return; }
  this.cx.beginPath();
  if (prevPos) {
    this.cx.moveTo(prevPos.x, prevPos.y); // from
    this.cx.lineTo(currentPos.x, currentPos.y);
    this.cx.stroke();
  }
}

 download_all_region_data() 
 {
  var all_region_data = this.pack_via_metadata();
  var blob_attr = {type: 'text/'+'json'+';charset=utf-8'};
  var all_region_data_blob = new Blob(all_region_data, blob_attr);
  this.save_data_to_local_file(all_region_data_blob, 'iat.'+'json');
}

 save_data_to_local_file(data, filename) {
  var a      = document.createElement('a');
  a.href     = URL.createObjectURL(data);
  a.target   = '_blank';
  a.download = filename;

  // simulate a mouse click event
  var event = new MouseEvent('click', {
    view: window,
    bubbles: true,
    cancelable: true
  });

  a.dispatchEvent(event);
}


 pack_via_metadata( ) 
   {
    // JSON.stringify() does not work with Map()
    // hence, we cast everything as objects
  
    var _via_img_metadata_as_obj = {};
 
    return [JSON.stringify(_via_img_metadata_as_obj)];
  }


}
