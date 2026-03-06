table 50203 "Customer Portal Setup"
{
    Caption = 'Customer Portal Setup';
    DataClassification = CustomerContent;

    fields
    {
        field(1; "Primary Key"; Code[10])
        {
            Caption = 'Primary Key';
        }
        field(2; "Ticket No. Series"; Code[20])
        {
            Caption = 'Ticket No. Series';
            TableRelation = "No. Series";
        }
        field(3; "Notification Email"; Text[250])
        {
            Caption = 'Notification Email';
        }
    }

    keys
    {
        key(PK; "Primary Key")
        {
            Clustered = true;
        }
    }
}
