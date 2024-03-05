import { Component, Inject } from '@angular/core';
import {
  MatDialog,
  MAT_DIALOG_DATA,
  MatDialogTitle,
  MatDialogContent,
} from '@angular/material/dialog';

interface DialogData {
  pic: string;
}

@Component({
  selector: 'app-flash-dialog',
  templateUrl: './flash-dialog.component.html',
  styleUrls: ['./flash-dialog.component.scss']
})
export class FlashDialogComponent {


  constructor(@Inject(MAT_DIALOG_DATA) public data: DialogData) {

  }
}
