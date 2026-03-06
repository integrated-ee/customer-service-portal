table 50200 "Support Ticket"
{
    Caption = 'Support Ticket';
    DataClassification = CustomerContent;

    fields
    {
        field(1; "No."; Code[20])
        {
            Caption = 'No.';
        }
        field(2; "Customer No."; Code[20])
        {
            Caption = 'Customer No.';
            TableRelation = Customer;
        }
        field(3; Subject; Text[250])
        {
            Caption = 'Subject';
        }
        field(4; Description; Text[2048])
        {
            Caption = 'Description';
        }
        field(5; Status; Enum "Support Ticket Status")
        {
            Caption = 'Status';
        }
        field(6; Category; Enum "Ticket Category")
        {
            Caption = 'Category';
        }
        field(7; Priority; Enum "Ticket Priority")
        {
            Caption = 'Priority';
        }
        field(8; "Created At"; DateTime)
        {
            Caption = 'Created At';
            Editable = false;
        }
        field(9; "Created By Email"; Text[250])
        {
            Caption = 'Created By Email';
        }
        field(10; "Resolved At"; DateTime)
        {
            Caption = 'Resolved At';
            Editable = false;
        }
        field(11; "Assigned To"; Text[100])
        {
            Caption = 'Assigned To';
        }
        field(12; "Modified At"; DateTime)
        {
            Caption = 'Modified At';
            Editable = false;
        }
    }

    keys
    {
        key(PK; "No.")
        {
            Clustered = true;
        }
        key(SK1; "Customer No.") { }
        key(SK2; Status) { }
    }

    trigger OnInsert()
    var
        Setup: Record "Customer Portal Setup";
        NoSeries: Codeunit "No. Series";
        SupportTicketMgt: Codeunit "Support Ticket Mgt.";
    begin
        if "No." = '' then begin
            if not Setup.Get() then
                SupportTicketMgt.InitSetup();
            Setup.Get();
            if Setup."Ticket No. Series" = '' then
                SupportTicketMgt.InitSetup();
            Setup.Get();
            Setup.TestField("Ticket No. Series");
            "No." := NoSeries.GetNextNo(Setup."Ticket No. Series");
        end;
        "Created At" := CurrentDateTime();
        "Modified At" := CurrentDateTime();
    end;

    trigger OnModify()
    var
        xTicket: Record "Support Ticket";
    begin
        "Modified At" := CurrentDateTime();
        xTicket.Get("No.");
        if (Status = Status::Resolved) and (xTicket.Status <> Status::Resolved) then
            "Resolved At" := CurrentDateTime();
    end;
}
