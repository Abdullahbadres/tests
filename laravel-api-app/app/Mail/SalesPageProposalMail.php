<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class SalesPageProposalMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public string $productName,
        public string $senderName,
        public string $senderEmail,
        public string $htmlContent,
        public string $attachmentFileName,
    ) {
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: "Sales Page Proposal - {$this->productName}",
        );
    }

    public function content(): Content
    {
        return new Content(
            htmlString: <<<HTML
<p>Hi Abdullah,</p>
<p>Please find the sales page proposal for <strong>{$this->productName}</strong> attached as an HTML file.</p>
<p>Regards,<br>{$this->senderName}</p>
HTML
        );
    }

    public function attachments(): array
    {
        return [
            \Illuminate\Mail\Mailables\Attachment::fromData(
                fn () => $this->htmlContent,
                $this->attachmentFileName
            )->withMime('text/html'),
        ];
    }
}

