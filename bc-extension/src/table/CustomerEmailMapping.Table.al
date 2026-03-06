table 50204 "Customer Email Mapping"
{
    Caption = 'Customer Email Mapping';
    DataClassification = CustomerContent;

    fields
    {
        field(1; "Email"; Text[250])
        {
            Caption = 'Email';
        }
        field(2; "Customer No."; Code[20])
        {
            Caption = 'Customer No.';
            TableRelation = Customer;
        }
        field(3; "Match Type"; Enum "Email Match Type")
        {
            Caption = 'Match Type';
        }
    }

    keys
    {
        key(PK; "Email")
        {
            Clustered = true;
        }
        key(SK1; "Customer No.") { }
    }
}
