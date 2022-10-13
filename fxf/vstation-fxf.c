/* vstation-fxf.c -- This file is part of VStation.
   Copyright (C) 2022 XNSC

   VStation is free software: you can redistribute it and/or modify
   it under the terms of the GNU Affero General Public License as
   published by the Free Software Foundation, either version 3 of the
   License, or (at your option) any later version.

   VStation is distributed in the hope that it will be useful,
   but WITHOUT ANY WARRANTY; without even the implied warranty of
   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
   GNU Affero General Public License for more details.

   You should have received a copy of the GNU Affero General Public License
   along with VStation. If not, see <https://www.gnu.org/licenses/>. */

#include <gio/gio.h>
#include <glib/gprintf.h>

static GFile *fxf_dir;

static gsize
dir_size (GFile *dir)
{
  GFileEnumerator *e =
    g_file_enumerate_children (dir, "standard::*",
			       G_FILE_QUERY_INFO_NOFOLLOW_SYMLINKS, NULL, NULL);
  GFileInfo *info;
  gsize size = 0;
  while ((info = g_file_enumerator_next_file (e, NULL, NULL)))
    {
      if (g_file_info_get_file_type (info) == G_FILE_TYPE_DIRECTORY)
	{
	  GFile *subdir =
	    g_file_resolve_relative_path (dir, g_file_info_get_name (info));
	  size += dir_size (subdir);
	}
      else
	size += g_file_info_get_size (info);
    }
  return size;
}

static void
read_fstab (void)
{
  GFile *file = g_file_new_for_path ("/etc/fstab");
  GFileInputStream *fis = g_file_read (file, NULL, NULL);
  GDataInputStream *stream;
  gchar *line;
  g_return_if_fail (fis);
  stream = g_data_input_stream_new (G_INPUT_STREAM (fis));
  while ((line = g_data_input_stream_read_line (stream, NULL, NULL, NULL)))
    {
      if (g_str_has_prefix (line, "/vstation_fxf"))
	{
	  gchar **items = g_strsplit_set (line, " \t", -1);
	  int i;
	  for (i = 0; items[i]; i++)
	    {
	      if (*items[i] == '/')
		{
		  fxf_dir = g_file_new_for_path (items[i]);
		  break;
		}
	    }
	  g_strfreev (items);
	  g_free (line);
	  break;
	}
      else
	g_free (line);
    }
  g_object_unref (fis);
  g_object_unref (file);
}

static void
copy_file (const gchar *path)
{
  GFile *file = g_file_new_for_path (path);
  GFileInfo *info = g_file_query_info (file, G_FILE_ATTRIBUTE_STANDARD_SIZE,
				       G_FILE_QUERY_INFO_NONE, NULL, NULL);
  gsize size;
  gsize fxf_size;
  gsize count = 0;
  gchar *suffix = g_strdup ("");
  g_return_if_fail (info);
  size = g_file_info_get_size (info);
  fxf_size = dir_size (fxf_dir);
  if (size + fxf_size >= 0x40000000)
    {
      g_critical ("File transfer directory exceeds maximum allowed size");
      g_object_unref (file);
      return;
    }

  while (TRUE)
    {
      GError *error = NULL;
      gchar *name =
	g_strdup_printf ("%s%s", g_file_get_basename (file), suffix);
      GFile *dest = g_file_get_child (fxf_dir, name);
      g_free (name);
      g_file_copy (file, dest, G_FILE_COPY_TARGET_DEFAULT_PERMS, NULL, NULL,
		   NULL, &error);
      if (error)
	{
	  if (error->code == G_FILE_ERROR_EXIST)
	    {
	      g_free (suffix);
	      suffix = g_strdup_printf (".%zu", count++);
	    }
	  else
	    {
	      g_critical ("%s", error->message);
	      break;
	    }
	}
      else
	break;
    }
  g_free (suffix);
  g_object_unref (file);
}

static void
remove_file (const gchar *path)
{
  g_critical ("Not implemented");
}

static void
bad_usage (void)
{
  g_fprintf (stderr, "Usage: vstation-fxf [add|remove] FILES...\n");
  exit (1);
}

int
main (int argc, char **argv)
{
  int i;
  if (argc < 3)
    bad_usage ();
  read_fstab ();
  g_return_val_if_fail (fxf_dir, 1);
  if (!g_strcmp0 (argv[1], "add"))
    {
      for (i = 2; i < argc; i++)
	copy_file (argv[i]);
    }
  else if (!g_strcmp0 (argv[1], "remove"))
    {
      for (i = 2; i < argc; i++)
	remove_file (argv[i]);
    }
  else
    {
      g_object_unref (fxf_dir);
      bad_usage ();
    }
  g_object_unref (fxf_dir);
  return 0;
}
