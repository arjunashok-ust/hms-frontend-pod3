import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-pagination',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './pagination.html',
  styleUrl: './pagination.css',
})
export class Pagination {
  @Input() page = 1;  
  @Input() totalPages = 1;
  @Input() hasNextPage = false;
  @Input() hasPrevPage = false;
  @Output() pageChange = new EventEmitter<number>();

  goTo(targetPage: number) {
    if (targetPage < 1 || targetPage > this.totalPages || targetPage === this.page) {
      return;
    }
    this.pageChange.emit(targetPage);
  }

  prev() {
    if (this.hasPrevPage) {
      this.goTo(this.page - 1);
    }
  }

  next() {
    if (this.hasNextPage) {
      this.goTo(this.page + 1);
    }
  }


  get visiblePages(): number[] {
    const total = this.totalPages;
    const current = this.page;

    if (total <= 7) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }

    const pages: number[] = [1];
    const start = Math.max(2, current - 1);
    const end = Math.min(total - 1, current + 1);

    if (start > 2) {
      pages.push(-1);
    }
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    if (end < total - 1) {
      pages.push(-1);
    }
    pages.push(total);

    return pages;
  }
}
