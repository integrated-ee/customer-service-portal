table 50201 "Ticket Comment"
{
    Caption = 'Ticket Comment';
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
        field(3; Comment; Text[2048])
        {
            Caption = 'Comment';
        }
        field(4; "Author Email"; Text[250])
        {
            Caption = 'Author Email';
        }
        field(5; "Author Type"; Enum "Author Type")
        {
            Caption = 'Author Type';
        }
        field(6; "Created At"; DateTime)
        {
            Caption = 'Created At';
            Editable = false;
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
        "Created At" := CurrentDateTime();
    end;
}
