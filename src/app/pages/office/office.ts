import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-office',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: 'office.html',
  styleUrls: ['office.scss']
})
export class Office {}