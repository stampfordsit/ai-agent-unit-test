public decimal ProcessInvoice(decimal subtotal, bool isMember)
{
    if (subtotal <= 0)
        throw new ArgumentException("Subtotal must be positive");

    decimal tax = subtotal * 0.07m;

    if (isMember)
        subtotal *= 0.95m;

    return subtotal + tax;
}