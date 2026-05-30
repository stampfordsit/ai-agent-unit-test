public bool ValidateOrder(decimal total, int itemCount, bool isActive)
{
    if (!isActive)
        return false;

    if (itemCount <= 0)
        return false;

    return total > 0;
}