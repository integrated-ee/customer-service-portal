table 50202 "Ticket Attachment"
{
    Caption = 'Ticket Attachment';
    DataClassification = CustomerContent;

    fields
    {
        field(1; "Ticket No."; Code[20])
        {
            Caption = 'Ticket No.';
            TableRelation = "Support Ticket"."No.";
        }
        field(2; "Line No."; Integer)
        {
            Caption = 'Line No.';
        }
        field(3; "File Name"; Text[250])
        {
            Caption = 'File Name';
        }
        field(4; "Blob URL"; Text[2048])
        {
            Caption = 'Blob URL';
        }
        field(5; "Content Type"; Text[100])
        {
            Caption = 'Content Type';
        }
        field(6; "Uploaded At"; DateTime)
        {
            Caption = 'Uploaded At';
            Editable = false;
        }
        field(7; "Uploaded By"; Text[250])
        {
            Caption = 'Uploaded By';
        }
    }

    keys
    {
        key(PK; "Ticket No.", "Line No.")
        {
            Clustered = true;
        }
    }

    trigger OnInsert()
    begin
        "Uploaded At" := CurrentDateTime();
    end;
}
