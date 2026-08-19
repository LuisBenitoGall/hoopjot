type ClassValue = string | false | null | undefined;

export function cx(...classes: ClassValue[]) {
  return classes.filter((className): className is string => Boolean(className)).join(' ');
}

