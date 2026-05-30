public string GetUpperName(string name)
{
    if (name == null)
        throw new ArgumentNullException(nameof(name));

    return name.ToUpper();
}